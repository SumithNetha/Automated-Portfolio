import { config } from '../../config';
import { scanForSecrets, sanitizeRedacted } from '../security/secretScanner';
import { buildSafeAIContextBlock, sanitizeUntrustedInput } from '../security/promptSanitizer';
import { AIAnalysisOutput, AIAnalysisOutputSchema, RepoAnalysisInput } from './types';
import {
  runStageADiscovery,
  runStageBModuleAnalysis,
  runStageCArchitecture,
  runStageDSynthesis,
} from '../analysis/codeAnalyzer';

export interface IAIProvider {
  analyzeRepository(input: RepoAnalysisInput): Promise<AIAnalysisOutput>;
}

/**
 * Mock Provider for local development, zero-token cost, and deterministic automated testing.
 * Runs multi-stage AST and code inspection when source files are present, strictly grounded
 * in file trees, README content, and source code without fabricating.
 */
export class MockAIProvider implements IAIProvider {
  async analyzeRepository(input: RepoAnalysisInput): Promise<AIAnalysisOutput> {
    const sourceFiles = input.sourceFiles || {};
    const readmeContent = input.readmeContent || '';

    // If source code files are provided, execute the 4-stage code analysis
    if (Object.keys(sourceFiles).length > 0) {
      const discovery = runStageADiscovery(input.fileTree, sourceFiles, readmeContent, input.repoName);
      const moduleAnalysis = runStageBModuleAnalysis(sourceFiles, input.repoName);
      const architecture = runStageCArchitecture(
        moduleAnalysis.modules,
        moduleAnalysis.apiEndpoints,
        moduleAnalysis.databaseSchemas
      );
      const synthesis = runStageDSynthesis(input, discovery, moduleAnalysis, architecture);
      return AIAnalysisOutputSchema.parse(synthesis);
    }

    // Fallback when only file tree and README are provided (e.g., partial sync)
    const discovery = runStageADiscovery(input.fileTree, {}, readmeContent, input.repoName);
    const moduleAnalysis = runStageBModuleAnalysis({}, input.repoName);
    const architecture = runStageCArchitecture([], [], []);
    const synthesis = runStageDSynthesis(input, discovery, moduleAnalysis, architecture);

    return AIAnalysisOutputSchema.parse(synthesis);
  }
}

/**
 * Builds a prompt for technical portfolio analysis with bounded token budgeting and multi-stage evidence context.
 */
function buildStructuredPrompt(input: RepoAnalysisInput): string {
  const maxBytes = config.analysis?.maxTotalSourceBytes || 256 * 1024;
  let currentBytes = 0;

  // Format source files with secret redaction and size limits
  const sourceFileBlocks: string[] = [];
  if (input.sourceFiles) {
    for (const [path, rawContent] of Object.entries(input.sourceFiles)) {
      if (currentBytes >= maxBytes) break;

      // Scan and redact secrets from source code before inclusion in prompt
      const sanitized = sanitizeRedacted(rawContent);
      const boundedContent = sanitized.length > 8000 ? sanitized.slice(0, 8000) + '\n...[truncated]' : sanitized;
      const block = buildSafeAIContextBlock(`source:${path}`, boundedContent);

      currentBytes += Buffer.byteLength(block, 'utf8');
      sourceFileBlocks.push(block);
    }
  }

  const commitMessagesText =
    input.actualCommitMessages && input.actualCommitMessages.length > 0
      ? input.actualCommitMessages.join('\n')
      : input.commitMessages
      ? input.commitMessages.join('\n')
      : 'Initial sync';

  return `You are an expert technical auditor and portfolio documentation architect.
Analyze the repository strictly based on the provided repository context, source code files, and README.
Never fabricate features, credentials, certifications, passing test results, or performance metrics.
Every significant technical claim MUST reference a concrete evidence file path from the repository.
Distinguish between implemented, partially implemented, and planned features.

Repository Name: ${input.repoName}
Owner: ${input.repoOwner}
Is Private: ${input.isPrivate}
File Tree (first 100 paths):
${input.fileTree.slice(0, 100).join('\n')}

${buildSafeAIContextBlock('README', sanitizeRedacted(input.readmeContent || 'No README provided'))}
${input.changedFiles ? buildSafeAIContextBlock('CHANGED_FILES', input.changedFiles.join('\n')) : ''}
${buildSafeAIContextBlock('COMMIT_MESSAGES', sanitizeRedacted(commitMessagesText))}

${sourceFileBlocks.length > 0 ? 'SOURCE CODE FILES:\n' + sourceFileBlocks.join('\n\n') : ''}

Output strictly valid JSON matching this exact structure:
{
  "repositoryName": "${input.repoName}",
  "repositoryUrl": "${input.repoUrl}",
  "primaryCategory": "One of: Software Projects, Web Development, Cloud Projects, Cybersecurity Projects, Networking Labs, Automation Tools and Scripts, Learning and Technical Notes, etc.",
  "secondaryCategories": ["string"],
  "projectTitle": "Clear, professional title",
  "shortSummary": "1-2 concise sentences summarizing verified engineering capabilities",
  "detailedDescription": "Comprehensive technical breakdown strictly grounded in the inspected code",
  "problemBeingSolved": "Problem statement grounded in evidence",
  "purposeOfTheProject": "Purpose grounded in code",
  "mainFeatures": [{"name": "string", "status": "implemented", "evidenceFile": "string"}],
  "partiallyImplementedFeatures": [{"name": "string", "status": "partial", "evidenceFile": "string", "notes": "string"}],
  "plannedFeatures": [{"name": "string", "evidenceFile": "string", "notes": "string"}],
  "existingModules": ["string"],
  "practicalLabs": [{"title": "string", "topics": ["string"], "evidenceFiles": ["string"]}],
  "technologiesAndLanguages": ["string"],
  "architectureSummary": "string",
  "demonstratedContributions": ["string"],
  "apiEndpoints": [{"method": "string", "path": "string", "description": "string", "file": "string"}],
  "databaseSchemas": [{"modelName": "string", "purpose": "string", "file": "string"}],
  "evidence": [{"claim": "string", "filePath": "string", "lineSnippet": "string"}],
  "currentDevelopmentStatus": "in_progress",
  "analysisCoverage": "full_code",
  "demoUrl": "Live URL if found in README or metadata, or omit if not found",
  "suggestedTags": ["string"],
  "portfolioPublicationRecommendation": "publish",
  "confidenceScore": 0.95,
  "missingInformation": [],
  "sensitiveWarnings": []
}`;
}

/**
 * OpenAI Live Provider
 */
export class OpenAIProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeRepository(input: RepoAnalysisInput): Promise<AIAnalysisOutput> {
    // Privacy Safeguard: Never send private repo content without explicit authorization
    if (input.isPrivate && !config.ai.allowPrivateRepos) {
      console.warn(
        `[AI Guard] ${input.repoName} is private and AI_ALLOW_PRIVATE_REPOS is false. Using local deterministic extraction to prevent code exfiltration.`
      );
      return new MockAIProvider().analyzeRepository(input);
    }

    const prompt = buildStructuredPrompt(input);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    return AIAnalysisOutputSchema.parse(parsed);
  }
}

/**
 * Gemini Live Provider
 */
export class GeminiProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeRepository(input: RepoAnalysisInput): Promise<AIAnalysisOutput> {
    // Privacy Safeguard: Never send private repo content without explicit authorization
    if (input.isPrivate && !config.ai.allowPrivateRepos) {
      console.warn(
        `[AI Guard] ${input.repoName} is private and AI_ALLOW_PRIVATE_REPOS is false. Using local deterministic extraction to prevent code exfiltration.`
      );
      return new MockAIProvider().analyzeRepository(input);
    }

    const prompt = buildStructuredPrompt(input);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(
      this.apiKey
    )}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      // On Google Gemini free tier, if the model experiences temporary spike (503) or rate limit (429),
      // gracefully fall back to local deterministic fact extraction so portfolio updates never fail.
      if (res.status === 503 || res.status === 429) {
        console.warn(
          `[Gemini Fallback] API returned status ${res.status} (High demand/rate limit). Seamlessly using verified fact extractor.`
        );
        return new MockAIProvider().analyzeRepository(input);
      }
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);
    return AIAnalysisOutputSchema.parse(parsed);
  }
}

/**
 * AI Provider Factory
 */
export function getAIProvider(): IAIProvider {
  // Always use deterministic Mock Provider during automated tests to guarantee 0 token cost and fast offline testing
  if (config.isTest || config.ai.provider === 'mock') {
    return new MockAIProvider();
  }
  if (config.ai.provider === 'openai' && config.ai.apiKey) {
    return new OpenAIProvider(config.ai.apiKey, config.ai.model);
  }
  if (config.ai.provider === 'gemini' && config.ai.apiKey) {
    return new GeminiProvider(config.ai.apiKey, config.ai.model);
  }
  return new MockAIProvider();
}
