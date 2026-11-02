import { describe, it, expect } from 'vitest';
import { selectFilesForAnalysis, scoreFileImportance, isEligibleFile } from '../src/services/analysis/fileSelector';
import {
  runStageADiscovery,
  runStageBModuleAnalysis,
  runStageCArchitecture,
  runStageDSynthesis,
} from '../src/services/analysis/codeAnalyzer';
import { computeFilesHash } from '../src/services/analysis/moduleCache';
import { GitHubService } from '../src/services/github/githubService';
import { MockAIProvider, OpenAIProvider, GeminiProvider } from '../src/services/ai/aiService';
import { scanForSecrets } from '../src/services/security/secretScanner';
import { config } from '../src/config';

describe('Priority 3 & 4: Full-Repository Code Analysis & Intelligence', () => {
  describe('File Selection & Smart Token Budgeting', () => {
    it('strictly excludes node_modules, lockfiles, and compiled binaries', () => {
      expect(isEligibleFile('node_modules/express/index.js')).toBe(false);
      expect(isEligibleFile('package-lock.json')).toBe(false);
      expect(isEligibleFile('yarn.lock')).toBe(false);
      expect(isEligibleFile('dist/bundle.js')).toBe(false);
      expect(isEligibleFile('public/image.png')).toBe(false);
      expect(isEligibleFile('models/weights.h5')).toBe(false);
      expect(isEligibleFile('src/server.ts')).toBe(true);
      expect(isEligibleFile('package.json')).toBe(true);
      expect(isEligibleFile('requirements.txt')).toBe(true);
    });

    it('prioritizes package manifests, entry points, and database schemas over utilities', () => {
      const manifestScore = scoreFileImportance('package.json', 'my-repo');
      const entryScore = scoreFileImportance('src/server.ts', 'my-repo');
      const modelScore = scoreFileImportance('src/models/User.ts', 'my-repo');
      const utilScore = scoreFileImportance('src/utils/helpers.ts', 'my-repo');

      expect(manifestScore).toBeGreaterThanOrEqual(100);
      expect(entryScore).toBeGreaterThan(utilScore);
      expect(modelScore).toBeGreaterThan(utilScore);
    });

    it('selects top files bounded by maxFiles budget', () => {
      const tree = [
        'README.md',
        'package.json',
        'src/server.ts',
        'src/routes/api.ts',
        'src/models/Item.ts',
        'node_modules/dummy/index.js',
        'package-lock.json',
        'tests/item.test.ts',
        'dist/out.js',
      ];
      const selected = selectFilesForAnalysis(tree, 'sample-app', { maxFiles: 4 });

      expect(selected.length).toBeLessThanOrEqual(4);
      expect(selected).toContain('package.json');
      expect(selected).not.toContain('node_modules/dummy/index.js');
      expect(selected).not.toContain('package-lock.json');
    });

    it('prioritizes changed files during incremental push analysis', () => {
      const tree = [
        'README.md',
        'package.json',
        'src/server.ts',
        'src/routes/new-feature.ts',
        'src/models/Item.ts',
      ];
      const selected = selectFilesForAnalysis(tree, 'sample-app', {
        changedFiles: ['src/routes/new-feature.ts'],
        maxFiles: 3,
      });

      expect(selected[0]).toBe('src/routes/new-feature.ts');
    });
  });

  describe('Multi-Stage Code Analysis Engine', () => {
    it('Stage A: Discovers frameworks and tech stack from package manifests', () => {
      const sourceFiles = {
        'package.json': JSON.stringify({
          name: 'ecommerce-app',
          dependencies: {
            react: '^18.2.0',
            express: '^4.18.2',
            mongoose: '^7.0.0',
          },
        }),
      };
      const discovery = runStageADiscovery(Object.keys(sourceFiles), sourceFiles, '', 'ecommerce-app');

      expect(discovery.detectedFrameworks).toContain('React');
      expect(discovery.detectedFrameworks).toContain('Express');
      expect(discovery.detectedFrameworks).toContain('Mongoose');
      expect(discovery.combinedTech).toContain('React');
      expect(discovery.combinedTech).toContain('Express');
    });

    it('Stage B: Extracts API endpoints, database schemas, and concrete evidence', () => {
      const sourceFiles = {
        'server/routes/booking.js': `
          const express = require('express');
          const router = express.Router();
          router.post('/api/bookings', bookingController.createBooking);
          router.get('/api/bookings', bookingController.listBookings);
          module.exports = router;
        `,
        'server/models/Booking.js': `
          const mongoose = require('mongoose');
          const BookingSchema = new mongoose.Schema({ status: String });
          module.exports = mongoose.model('Booking', BookingSchema);
        `,
      };

      const result = runStageBModuleAnalysis(sourceFiles, 'carcare');

      expect(result.modules.length).toBeGreaterThan(0);
      expect(result.apiEndpoints.some((ep) => ep.method === 'POST' && ep.path === '/api/bookings')).toBe(true);
      expect(result.apiEndpoints.some((ep) => ep.method === 'GET' && ep.path === '/api/bookings')).toBe(true);
      expect(result.databaseSchemas.some((db) => db.modelName === 'Booking')).toBe(true);
    });

    it('Stage C: Traces architectural data flows across components', () => {
      const modules = [
        {
          moduleName: 'User Interface & Frontend',
          files: ['client/src/App.jsx'],
          purpose: 'UI layer',
          keyComponents: ['App.jsx'],
          apisExposed: [],
          databaseInteractions: [],
          dependencies: [],
          evidenceClaims: [],
          status: 'implemented' as const,
        },
        {
          moduleName: 'API Routes & Controllers',
          files: ['server/routes/api.js'],
          purpose: 'API layer',
          keyComponents: ['api.js'],
          apisExposed: ['GET /api/items'],
          databaseInteractions: [],
          dependencies: [],
          evidenceClaims: [],
          status: 'implemented' as const,
        },
      ];

      const architecture = runStageCArchitecture(
        modules,
        [{ method: 'GET', path: '/api/items' }],
        [{ modelName: 'Item' }]
      );

      expect(architecture.components.some((c) => c.layer === 'frontend')).toBe(true);
      expect(architecture.components.some((c) => c.layer === 'backend')).toBe(true);
      expect(architecture.dataFlows.length).toBeGreaterThan(0);
    });

    it('Stage D: Synthesizes evidence-grounded output without fabricating', () => {
      const input = {
        repoName: 'CarCARE',
        repoOwner: 'SumithNetha',
        repoUrl: 'https://github.com/SumithNetha/CarCARE',
        isPrivate: false,
        defaultBranch: 'main',
        fileTree: ['README.md', 'client/src/App.jsx', 'server/server.js'],
        sourceFiles: {
          'server/server.js': `app.listen(5000);`,
        },
      };

      const discovery = runStageADiscovery(input.fileTree, input.sourceFiles, 'Full-stack car care app', 'CarCARE');
      const moduleAnalysis = runStageBModuleAnalysis(input.sourceFiles, 'CarCARE');
      const architecture = runStageCArchitecture(moduleAnalysis.modules, [], []);
      const output = runStageDSynthesis(input, discovery, moduleAnalysis, architecture);

      expect(output.repositoryName).toBe('CarCARE');
      expect(output.mainFeatures.length).toBeGreaterThan(0);
      expect(output.mainFeatures.every((f) => f.evidenceFile !== undefined)).toBe(true);
      expect(output.analysisCoverage).toBe('full_code');
      expect(output.confidenceScore).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Source-File Retrieval & Fallbacks', () => {
    it('retrieves authentic verified source files for known engineering repositories', async () => {
      const ghService = new GitHubService();

      const ccnaPat = await ghService.fetchFileContent('SumithNetha', 'CCNA', 'Week-07/June-15/NAT Overload/pat_configuration.ios');
      expect(ccnaPat).not.toBeNull();
      expect(ccnaPat).toContain('ip nat inside');
      expect(ccnaPat).toContain('overload');

      const carcareBooking = await ghService.fetchFileContent('SumithNetha', 'CarCARE', 'server/controllers/booking.controller.js');
      expect(carcareBooking).not.toBeNull();
      expect(carcareBooking).toContain('createBooking');

      const idsApp = await ghService.fetchFileContent('SumithNetha', 'iot-network-intrusion-detection', 'app.py');
      expect(idsApp).not.toBeNull();
      expect(idsApp).toContain('predict_intrusion');

      const wweStatWheel = await ghService.fetchFileContent('SumithNetha', 'WWE-Trump-Card-Multiplayer-Game', 'public/statWheel.js');
      expect(wweStatWheel).not.toBeNull();
      expect(wweStatWheel).toContain('StatWheel');
    });

    it('batch retrieves multiple files with concurrency', async () => {
      const ghService = new GitHubService();
      const files = await ghService.fetchMultipleFiles('SumithNetha', 'CCNA', [
        'Week-07/June-15/NAT Overload/pat_configuration.ios',
        'Week-08/June-22/VLANs/vlan_trunking.ios',
        'Week-12/July-20/OSPFv2 Single Area/ospf_area0.ios',
      ]);

      expect(files.size).toBe(3);
      expect(files.has('Week-07/June-15/NAT Overload/pat_configuration.ios')).toBe(true);
      expect(files.has('Week-08/June-22/VLANs/vlan_trunking.ios')).toBe(true);
      expect(files.has('Week-12/July-20/OSPFv2 Single Area/ospf_area0.ios')).toBe(true);
    });
  });

  describe('Incremental Analysis & Caching', () => {
    it('computes content hashes and detects file changes', () => {
      const filesA = { 'src/server.ts': 'console.log("v1");' };
      const filesB = { 'src/server.ts': 'console.log("v2");' };

      const hashA = computeFilesHash(['src/server.ts'], filesA);
      const hashB = computeFilesHash(['src/server.ts'], filesB);

      expect(hashA).not.toBe(hashB);
      expect(computeFilesHash(['src/server.ts'], filesA)).toBe(hashA);
    });
  });

  describe('Priority 6: Private Repository Safeguards', () => {
    it('OpenAI provider falls back to Mock provider for private repos when AI_ALLOW_PRIVATE_REPOS is false', async () => {
      const openai = new OpenAIProvider('fake-openai-key');
      const input = {
        repoName: 'secret-private-repo',
        repoOwner: 'owner',
        repoUrl: 'https://github.com/owner/secret-private-repo',
        isPrivate: true, // PRIVATE!
        defaultBranch: 'main',
        fileTree: ['src/index.ts'],
        sourceFiles: { 'src/index.ts': 'const x = 1;' },
      };

      // Ensure config prohibits sending private code
      config.ai.allowPrivateRepos = false;

      const result = await openai.analyzeRepository(input);
      expect(result.repositoryName).toBe('secret-private-repo');
      expect(result.portfolioPublicationRecommendation).toBe('needs_review');
    });

    it('Gemini provider falls back to Mock provider for private repos when AI_ALLOW_PRIVATE_REPOS is false', async () => {
      const gemini = new GeminiProvider('fake-gemini-key');
      const input = {
        repoName: 'confidential-internal-repo',
        repoOwner: 'owner',
        repoUrl: 'https://github.com/owner/confidential-internal-repo',
        isPrivate: true, // PRIVATE!
        defaultBranch: 'main',
        fileTree: ['app.py'],
        sourceFiles: { 'app.py': 'print("confidential")' },
      };

      config.ai.allowPrivateRepos = false;

      const result = await gemini.analyzeRepository(input);
      expect(result.repositoryName).toBe('confidential-internal-repo');
      expect(result.portfolioPublicationRecommendation).toBe('needs_review');
    });

    it('scans and flags secrets in source files', () => {
      const sourceWithSecret = `
        const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
        const dbUri = "mongodb://user:pass@internal-cluster.local:27017/db";
      `;
      const result = scanForSecrets(sourceWithSecret, 'src/config.ts');
      expect(result.hasSecret).toBe(true);
      expect(result.blocked).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

