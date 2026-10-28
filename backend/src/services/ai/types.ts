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
  architectureSummary: z.string().optional(),
  demonstratedContributions: z.array(z.string()).default([]),
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
  changedFiles?: string[];
  commitMessages?: string[];
  previousAnalysis?: Partial<AIAnalysisOutput>;
}
