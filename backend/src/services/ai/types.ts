import { z } from 'zod';

export const AIAnalysisOutputSchema = z.object({
  repositoryName: z.string(),
  repositoryUrl: z.string(),
  primaryCategory: z.string(),
  secondaryCategories: z.array(z.string()).default([]),
  projectTitle: z.string(),
  shortSummary: z.string(),
  detailedDescription: z.string(),
  problemBeingSolved: z.string().default(''),
  purposeOfTheProject: z.string(),
  mainFeatures: z
    .array(
      z.object({
        name: z.string(),
        status: z.enum(['implemented', 'in_progress', 'planned']).default('implemented'),
        evidenceFile: z.string().default(''),
      })
    )
    .default([]),
  partiallyImplementedFeatures: z
    .array(
      z.object({
        name: z.string(),
        status: z.string().default('partial'),
        evidenceFile: z.string().default(''),
        notes: z.string().optional(),
      })
    )
    .default([]),
  plannedFeatures: z
    .array(
      z.object({
        name: z.string(),
        evidenceFile: z.string().default(''),
        notes: z.string().optional(),
      })
    )
    .default([]),
  existingModules: z.array(z.string()).default([]),
  practicalLabs: z
    .array(
      z.object({
        title: z.string(),
        topics: z.array(z.string()).default([]),
        evidenceFiles: z.array(z.string()).default([]),
      })
    )
    .default([]),
  technologiesAndLanguages: z.array(z.string()).default([]),
  architectureSummary: z.string().nullable().optional(),
  demonstratedContributions: z.array(z.string()).default([]),
  apiEndpoints: z
    .array(
      z.object({
        method: z.string(),
        path: z.string(),
        description: z.string().optional(),
        file: z.string().optional(),
      })
    )
    .default([]),
  databaseSchemas: z
    .array(
      z.object({
        modelName: z.string(),
        purpose: z.string().optional(),
        file: z.string().optional(),
      })
    )
    .default([]),
  demoUrl: z.string().nullable().optional(),
  evidence: z
    .array(
      z.object({
        claim: z.string(),
        filePath: z.string(),
        lineSnippet: z.string().optional(),
      })
    )
    .default([]),
  currentDevelopmentStatus: z
    .enum(['completed', 'in_progress', 'experimental', 'archived'])
    .default('in_progress'),
  analysisCoverage: z
    .enum(['full_code', 'incremental_diff', 'readme_and_tree', 'fallback_heuristic'])
    .default('full_code'),
  suggestedTags: z.array(z.string()).default([]),
  portfolioPublicationRecommendation: z
    .enum(['publish', 'needs_review', 'do_not_publish'])
    .default('publish'),
  confidenceScore: z.number().min(0).max(1).default(0.9),
  missingInformation: z.array(z.string()).default([]),
  sensitiveWarnings: z.array(z.string()).default([]),
});

export type AIAnalysisOutput = z.infer<typeof AIAnalysisOutputSchema>;

export interface RepoAnalysisInput {
  repoName: string;
  repoOwner: string;
  repoUrl: string;
  isPrivate: boolean;
  defaultBranch: string;
  readmeContent?: string;
  fileTree: string[];
  manifests?: Record<string, string>; // e.g. package.json, requirements.txt, etc.
  sourceFiles?: Record<string, string>; // relative path -> content
  changedFiles?: string[];
  commitMessages?: string[];
  actualCommitMessages?: string[];
  previousAnalysis?: Partial<AIAnalysisOutput>;
  coverageMode?: 'full_code' | 'incremental_diff' | 'readme_and_tree';
}

/**
 * Stage B Module Summary
 */
export interface ModuleSummary {
  moduleName: string;
  files: string[];
  purpose: string;
  keyComponents: string[];
  apisExposed: string[];
  databaseInteractions: string[];
  dependencies: string[];
  evidenceClaims: Array<{ claim: string; filePath: string; lineSnippet?: string }>;
  status: 'implemented' | 'in_progress' | 'planned';
}

/**
 * Stage C Architecture & Flow Analysis
 */
export interface ArchitectureFlow {
  components: Array<{ name: string; role: string; layer: 'frontend' | 'backend' | 'database' | 'infra' | 'lab' | 'ml' }>;
  dataFlows: Array<{ from: string; to: string; description: string }>;
  verifiedIntegrations: string[];
  unverifiedOrPlanned: string[];
}
