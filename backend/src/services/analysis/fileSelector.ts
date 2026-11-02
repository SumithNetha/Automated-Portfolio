/**
 * Intelligent Repository File Selector & Token Budgeting
 * Selects the most architecturally significant source files while filtering noise,
 * binaries, generated artifacts, and third-party dependencies.
 */

// Extensions and paths strictly excluded from analysis
const EXCLUDED_DIRS = [
  'node_modules',
  'vendor',
  '.git',
  '.github',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  'target',
  'bin',
  'obj',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  'venv',
  '.venv',
  'env',
  '.turbo',
  '.gradle',
];

const EXCLUDED_EXTENSIONS = new Set([
  // Binaries & Executables
  '.exe', '.dll', '.so', '.dylib', '.bin', '.obj', '.o', '.a', '.lib',
  // Media & Images
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.mp4', '.mp3', '.mov', '.avi',
  // Archives
  '.zip', '.tar', '.gz', '.rar', '.7z', '.iso', '.bz2',
  // Fonts & Documents
  '.ttf', '.woff', '.woff2', '.eot', '.pdf', '.docx', '.xlsx',
  // Minified & Map files
  '.min.js', '.min.css', '.map',
  // Large Model Weights & Data files
  '.h5', '.pkl', '.pt', '.pth', '.onnx', '.tflite', '.parquet', '.feather', '.pkt',
  // Lock files (contain no architectural logic, huge token waste)
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'cargo.lock', 'poetry.lock',
]);

export interface FileSelectionOptions {
  maxFiles?: number;
  maxFileSizeBytes?: number;
  maxTotalBytes?: number;
  changedFilesOnly?: boolean;
  changedFiles?: string[];
}

/**
 * Checks if a file path points to an excluded folder or noise file
 */
export function isEligibleFile(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false;

  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/');

  // Check excluded directories
  for (const seg of segments.slice(0, -1)) {
    if (EXCLUDED_DIRS.includes(seg.toLowerCase())) {
      return false;
    }
  }

  // Check excluded exact filenames
  const fileName = segments[segments.length - 1].toLowerCase();
  if (EXCLUDED_EXTENSIONS.has(fileName)) {
    return false;
  }

  // Check excluded extensions
  for (const ext of EXCLUDED_EXTENSIONS) {
    if (ext.startsWith('.') && fileName.endsWith(ext)) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates architectural importance score (higher = higher priority to inspect)
 */
export function scoreFileImportance(filePath: string, repoName: string): number {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const fileName = normalized.split('/').pop() || '';

  let score = 0;

  // 1. Dependency Manifests (Highest priority for identifying ecosystem and frameworks)
  if (
    fileName === 'package.json' ||
    fileName === 'requirements.txt' ||
    fileName === 'pyproject.toml' ||
    fileName === 'pom.xml' ||
    fileName === 'build.gradle' ||
    fileName === 'go.mod' ||
    fileName === 'cargo.toml' ||
    fileName === 'gemfile' ||
    fileName === 'composer.json'
  ) {
    return 150;
  }

  // 2. Application Entry Points
  if (
    fileName === 'server.ts' ||
    fileName === 'server.js' ||
    fileName === 'index.ts' ||
    fileName === 'index.js' ||
    fileName === 'main.ts' ||
    fileName === 'main.js' ||
    fileName === 'app.py' ||
    fileName === 'main.py' ||
    fileName === 'main.go' ||
    fileName === 'app.ts' ||
    fileName === 'app.js' ||
    fileName === 'app.jsx' ||
    fileName === 'app.tsx' ||
    fileName === 'index.php'
  ) {
    score += 90;
  }

  // 3. Database Schemas & Models
  if (normalized.includes('/models/') || normalized.includes('/schemas/') || normalized.includes('/entities/')) {
    score += 85;
  }
  if (fileName.endsWith('.sql') || normalized.includes('/database/') || normalized.includes('/db/')) {
    score += 80;
  }

  // 4. API Routes, Endpoints & Controllers
  if (
    normalized.includes('/routes/') ||
    normalized.includes('/controllers/') ||
    normalized.includes('/api/') ||
    normalized.includes('/endpoints/')
  ) {
    score += 85;
  }

  // 5. Practical Lab Configurations & Automation Scripts (e.g., CCNA, Cisco IOS, Netmiko)
  if (
    normalized.endsWith('.ios') ||
    normalized.endsWith('.cfg') ||
    normalized.includes('week-') ||
    normalized.includes('/labs/') ||
    normalized.includes('netmiko')
  ) {
    score += 85;
  }

  // 6. Core Services & Middleware
  if (normalized.includes('/services/') || normalized.includes('/middleware/') || normalized.includes('/auth/')) {
    score += 75;
  }

  // 7. Frontend UI Logic & Components
  if (
    normalized.includes('/components/') ||
    normalized.includes('/pages/') ||
    normalized.includes('/views/') ||
    normalized.includes('/screens/')
  ) {
    score += 70;
  }

  // 8. Infrastructure & Deployment Configurations
  if (
    fileName === 'dockerfile' ||
    fileName === 'docker-compose.yml' ||
    fileName === 'docker-compose.yaml' ||
    fileName.endsWith('.tf') ||
    fileName === 'tsconfig.json' ||
    fileName === 'vite.config.ts' ||
    fileName === 'vite.config.js'
  ) {
    score += 65;
  }

  // 9. Automated Tests (useful for verifying capabilities and assertions)
  if (
    normalized.includes('/tests/') ||
    normalized.includes('/test/') ||
    fileName.includes('.test.') ||
    fileName.includes('.spec.')
  ) {
    score += 60;
  }

  // 10. General source code files
  if (
    fileName.endsWith('.ts') ||
    fileName.endsWith('.tsx') ||
    fileName.endsWith('.js') ||
    fileName.endsWith('.jsx') ||
    fileName.endsWith('.py') ||
    fileName.endsWith('.java') ||
    fileName.endsWith('.go') ||
    fileName.endsWith('.php') ||
    fileName.endsWith('.c') ||
    fileName.endsWith('.cpp') ||
    fileName.endsWith('.rs') ||
    fileName.endsWith('.sh')
  ) {
    score += 50;
  }

  // Penalize deep nesting
  const depth = filePath.split(/[/\\]/).length;
  if (depth > 5) {
    score -= (depth - 5) * 5;
  }

  return Math.max(score, 10);
}

/**
 * Selects the optimal set of source files to fetch and inspect for a repository
 */
export function selectFilesForAnalysis(
  tree: string[],
  repoName: string,
  options: FileSelectionOptions = {}
): string[] {
  const maxFiles = options.maxFiles || 25;

  // If changed files are specified for an incremental push, prioritize changed files
  if (options.changedFiles && options.changedFiles.length > 0) {
    const eligibleChanged = options.changedFiles.filter(isEligibleFile);
    if (eligibleChanged.length > 0) {
      // Return eligible changed files plus top manifests/entry points up to maxFiles
      const otherEligible = tree
        .filter((f) => !options.changedFiles!.includes(f) && isEligibleFile(f))
        .map((f) => ({ path: f, score: scoreFileImportance(f, repoName) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(5, maxFiles - eligibleChanged.length))
        .map((item) => item.path);

      return Array.from(new Set([...eligibleChanged, ...otherEligible])).slice(0, maxFiles);
    }
  }

  // Full analysis selection: filter and rank all eligible files
  const eligible = tree.filter(isEligibleFile);

  const scored = eligible.map((filePath) => ({
    filePath,
    score: scoreFileImportance(filePath, repoName),
  }));

  // Sort descending by importance score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxFiles).map((item) => item.filePath);
}
