import crypto from 'crypto';
import { config } from '../../config';

export interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  htmlUrl: string;
  description: string;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  language: string;
}

export interface WebhookPushPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      name?: string;
      login: string;
    };
    html_url: string;
    default_branch: string;
    private: boolean;
    description: string | null;
  };
  commits: Array<{
    id: string;
    message: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit?: {
    id: string;
    message: string;
    added: string[];
    removed: string[];
    modified: string[];
  };
}

/**
 * Verify GitHub webhook HMAC SHA256 signature
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  secret: string = config.github.webhookSecret
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const expectedPrefix = 'sha256=';
  if (!signatureHeader.startsWith(expectedPrefix)) {
    return false;
  }

  const signature = signatureHeader.substring(expectedPrefix.length);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody);
  const digest = hmac.digest('hex');

  const signatureBuffer = Buffer.from(signature, 'hex');
  const digestBuffer = Buffer.from(digest, 'hex');

  if (signatureBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
}

/**
 * GitHub API Client with token-awareness and rich offline/mock fallback for tests and zero-credential local dev
 */
export class GitHubService {
  private token: string;

  constructor(token?: string) {
    this.token = token || config.github.personalAccessToken;
  }

  /**
   * Fetch accessible repositories for current user
   */
  async listUserRepositories(): Promise<GitHubRepoSummary[]> {
    if (this.token && !this.token.startsWith('ghp_your')) {
      try {
        const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AI-GitHub-Portfolio',
          },
        });

        if (res.ok) {
          const repos: any = await res.json();
          return repos.map((r: any) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            owner: r.owner.login,
            isPrivate: r.private,
            htmlUrl: r.html_url,
            description: r.description || '',
            defaultBranch: r.default_branch || 'main',
            starsCount: r.stargazers_count || 0,
            forksCount: r.forks_count || 0,
            language: r.language || '',
          }));
        }
      } catch (err) {
        console.warn('[GitHubService] Failed to fetch live repos, using fallback dataset:', err);
      }
    }

    // Default high-fidelity repositories representing real personal engineering work
    return [
      {
        id: 10101,
        name: 'ccna-networking-labs',
        fullName: 'portfolio-owner/ccna-networking-labs',
        owner: 'portfolio-owner',
        isPrivate: false,
        htmlUrl: 'https://github.com/portfolio-owner/ccna-networking-labs',
        description:
          'Hands-on Cisco Packet Tracer & GNS3 labs covering VLANs, 802.1Q trunks, OSPFv2, Access Control Lists (ACLs), and NAT configurations.',
        defaultBranch: 'main',
        starsCount: 18,
        forksCount: 4,
        language: 'RouterOS',
      },
      {
        id: 10102,
        name: 'carcare-connect-platform',
        fullName: 'portfolio-owner/carcare-connect-platform',
        owner: 'portfolio-owner',
        isPrivate: false,
        htmlUrl: 'https://github.com/portfolio-owner/carcare-connect-platform',
        description:
          'Full-stack enterprise automotive service booking and diagnostics platform built with React, TypeScript, Node.js, and MongoDB.',
        defaultBranch: 'main',
        starsCount: 34,
        forksCount: 6,
        language: 'TypeScript',
      },
      {
        id: 10103,
        name: 'aws-cloud-infrastructure-iac',
        fullName: 'portfolio-owner/aws-cloud-infrastructure-iac',
        owner: 'portfolio-owner',
        isPrivate: false,
        htmlUrl: 'https://github.com/portfolio-owner/aws-cloud-infrastructure-iac',
        description:
          'Production-grade Terraform modules deploying resilient multi-AZ AWS VPC, ECS Fargate clusters, Application Load Balancers, and RDS Postgres.',
        defaultBranch: 'main',
        starsCount: 22,
        forksCount: 3,
        language: 'HCL',
      },
      {
        id: 10104,
        name: 'python-security-audit-tool',
        fullName: 'portfolio-owner/python-security-audit-tool',
        owner: 'portfolio-owner',
        isPrivate: false,
        htmlUrl: 'https://github.com/portfolio-owner/python-security-audit-tool',
        description:
          'Automated security scanning script inspecting network endpoints, TLS cipher suites, open ports, and missing HTTP security headers.',
        defaultBranch: 'main',
        starsCount: 12,
        forksCount: 2,
        language: 'Python',
      },
    ];
  }

  /**
   * Fetch repository file tree
   */
  async fetchRepoTree(owner: string, repo: string, branch: string = 'main'): Promise<string[]> {
    if (this.token && !this.token.startsWith('ghp_your')) {
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AI-GitHub-Portfolio',
          },
        });
        if (res.ok) {
          const data: any = await res.json();
          if (Array.isArray(data.tree)) {
            return data.tree.map((node: any) => node.path);
          }
        }
      } catch (err) {
        console.warn(`[GitHubService] Error fetching tree for ${owner}/${repo}:`, err);
      }
    }

    // High fidelity file tree simulations for mock repos
    if (/ccna/i.test(repo)) {
      return [
        'README.md',
        'topologies/enterprise-network-diagram.png',
        'labs/01-vlan-trunking/configs/switch1-c2960.ios',
        'labs/01-vlan-trunking/configs/switch2-c2960.ios',
        'labs/01-vlan-trunking/README.md',
        'labs/02-ospf-single-area/configs/r1-c1941.ios',
        'labs/02-ospf-single-area/configs/r2-c1941.ios',
        'labs/02-ospf-single-area/configs/r3-c1941.ios',
        'labs/03-acls-and-nat/configs/perimeter-router.ios',
        'labs/03-acls-and-nat/verification-commands.txt',
        'notes/subnetting-cheatsheet.md',
        'notes/spanning-tree-protocol-notes.md',
      ];
    }

    if (/carcare/i.test(repo)) {
      return [
        'README.md',
        'package.json',
        'tsconfig.json',
        'src/server.ts',
        'src/routes/auth.routes.ts',
        'src/routes/booking.routes.ts',
        'src/controllers/booking.controller.ts',
        'src/models/Vehicle.ts',
        'src/models/ServiceTicket.ts',
        'client/src/App.tsx',
        'client/src/components/Dashboard.tsx',
        'tests/booking.spec.ts',
        'docker-compose.yml',
      ];
    }

    return [
      'README.md',
      'src/main.ts',
      'src/index.ts',
      'package.json',
      'tests/unit.test.ts',
      '.gitignore',
    ];
  }

  /**
   * Fetch README content
   */
  async fetchReadme(owner: string, repo: string, branch: string = 'main'): Promise<string> {
    if (this.token && !this.token.startsWith('ghp_your')) {
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme?ref=${branch}`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.raw',
            'User-Agent': 'AI-GitHub-Portfolio',
          },
        });
        if (res.ok) {
          return await res.text();
        }
      } catch (err) {
        console.warn(`[GitHubService] Error fetching README for ${owner}/${repo}:`, err);
      }
    }

    if (/ccna/i.test(repo)) {
      return `# CCNA Practical Networking Labs & Configurations

This repository contains hands-on Cisco lab topologies and running configurations built during CCNA 200-301 preparation.

## Implemented Labs
- **VLAN & Trunking:** 802.1Q encapsulation, Native VLAN security, Router-on-a-Stick.
- **Routing:** OSPFv2 Single Area and Multi-Area configuration, DR/BDR election verification.
- **Security:** Standard and Extended Access Control Lists (ACLs) blocking unauthorized subnets.
- **NAT:** Overloaded NAT (PAT) translating RFC 1918 private addresses to public egress.

## Tools
- Cisco Packet Tracer 8.2
- GNS3 with Cisco c7200 IOS images
- Wireshark packet analysis
`;
    }

    return `# ${repo}\n\nTechnical engineering repository containing source code, configurations, and verification tests.`;
  }
}
