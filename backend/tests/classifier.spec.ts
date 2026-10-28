import { describe, it, expect } from 'vitest';
import {
  classifyRepository,
  evaluateChangeSignificance,
} from '../src/services/classifier/deterministicClassifier';

describe('Deterministic Classification & Change Significance', () => {
  it('correctly classifies a CCNA networking repository as Networking Labs', () => {
    const result = classifyRepository(
      'ccna-labs',
      'Packet Tracer and GNS3 labs for CCNA 200-301 with VLANs and OSPF',
      ['labs/01-vlan/config.ios', 'labs/02-ospf/config.ios'],
      '# CCNA Networking Labs\nVLANs, Trunking, and OSPF routing configurations'
    );

    expect(result.primaryCategory).toBe('Networking Labs');
    expect(result.entryType).toBe('lab_collection');
    expect(result.detectedTechnologies).toContain('Cisco IOS');
    expect(result.detectedTechnologies).toContain('Networking');
  });

  it('correctly classifies a Terraform and AWS repository as Cloud Projects', () => {
    const result = classifyRepository(
      'aws-iac-infrastructure',
      'Terraform modules for multi-AZ VPC and ECS clusters on AWS',
      ['main.tf', 'variables.tf', 'modules/vpc/main.tf'],
      '# AWS Infrastructure via Terraform'
    );

    expect(result.primaryCategory).toBe('Cloud Projects');
    expect(result.detectedTechnologies).toContain('AWS');
    expect(result.detectedTechnologies).toContain('Terraform');
  });

  it('correctly classifies a React + Node web app as Web Development', () => {
    const result = classifyRepository(
      'carcare-connect',
      'Automotive booking portal',
      ['client/src/App.tsx', 'server/src/server.ts', 'package.json'],
      '# CarCare Connect\nFull stack React and Node.js portal'
    );

    expect(result.primaryCategory).toBe('Web Development');
    expect(result.detectedTechnologies).toContain('React');
    expect(result.detectedTechnologies).toContain('TypeScript');
  });

  it('identifies insignificant formatting/linter changes', () => {
    const sig = evaluateChangeSignificance(
      ['.prettierrc', '.eslintrc.json'],
      ['fix: code formatting and whitespace']
    );

    expect(sig.isSignificant).toBe(false);
    expect(sig.category).toBe('insignificant_formatting');
  });

  it('identifies documentation-only changes', () => {
    const sig = evaluateChangeSignificance(
      ['README.md', 'docs/architecture.md'],
      ['docs: clarify setup prerequisites']
    );

    expect(sig.isSignificant).toBe(true);
    expect(sig.category).toBe('documentation_only');
  });

  it('identifies feature additions', () => {
    const sig = evaluateChangeSignificance(
      ['src/routes/auth.ts', 'src/controllers/auth.ts'],
      ['feat: add jwt authentication endpoints']
    );

    expect(sig.isSignificant).toBe(true);
    expect(sig.category).toBe('feature_addition');
  });
});
