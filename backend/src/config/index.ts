import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory or root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '5000', 10),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  mongoUri: process.env.MONGODB_URI || 'memory',

  // Security & Authentication
  sessionSecret: process.env.SESSION_SECRET || 'dev-fallback-session-secret-min-32-chars-long-security-key!',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
  adminInitialPassword: process.env.ADMIN_PASSWORD || 'admin-secure-initial-password-123!',

  // GitHub Integration
  github: {
    personalAccessToken: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/github/callback',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
  },

  // AI Analysis Provider
  ai: {
    provider: (process.env.AI_PROVIDER || 'mock').toLowerCase() as 'mock' | 'openai' | 'gemini',
    apiKey: process.env.AI_API_KEY || '',
    model:
      process.env.AI_MODEL ||
      (process.env.AI_PROVIDER === 'gemini' ? 'gemini-flash-lite-latest' : 'gpt-4o-mini'),
    allowPrivateRepos: process.env.AI_ALLOW_PRIVATE_REPOS === 'true',
  },

  // Publication Defaults
  publication: {
    autoPublishConfident: process.env.AUTO_PUBLISH_CONFIDENT !== 'false',
    requireReviewOnSensitive: process.env.REQUIRE_REVIEW_ON_SENSITIVE !== 'false',
    blockPrivateByDefault: process.env.BLOCK_PRIVATE_REPOS_BY_DEFAULT !== 'false',
    confidenceThreshold: 0.75, // AI confidence needed for auto-publish
  },

  // Code Analysis Budgets & Limits
  analysis: {
    maxSourceFiles: parseInt(process.env.ANALYSIS_MAX_FILES || '25', 10),
    maxFileSizeBytes: parseInt(process.env.ANALYSIS_MAX_FILE_SIZE || `${64 * 1024}`, 10), // 64KB max per file
    maxTotalSourceBytes: parseInt(process.env.ANALYSIS_MAX_TOTAL_BYTES || `${256 * 1024}`, 10), // 256KB total source budget
    maxConcurrency: parseInt(process.env.ANALYSIS_CONCURRENCY || '5', 10),
    timeoutMs: parseInt(process.env.ANALYSIS_TIMEOUT_MS || '60000', 10), // 60s
    cacheTtlHours: parseInt(process.env.ANALYSIS_CACHE_TTL_HOURS || '24', 10),
  },
};

export const PORTFOLIO_CATEGORIES = [
  'Software Projects',
  'Web Development',
  'Cloud Projects',
  'Cybersecurity Projects',
  'Networking Labs',
  'Automation Tools and Scripts',
  'Open-Source Contributions',
  'Learning and Technical Notes',
  'Certification Preparation',
  'Earned Certifications',
  'Research and Experiments',
  'Other Technical Work',
] as const;

export type PortfolioCategory = typeof PORTFOLIO_CATEGORIES[number];
