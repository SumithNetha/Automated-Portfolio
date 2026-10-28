/**
 * Secret and Sensitive-Content Protection Scanner
 * Scans repository contents, changed files, and generated text for accidental credential leaks.
 */

interface SecretMatchPattern {
  name: string;
  regex: RegExp;
  severity: 'high' | 'critical';
}

const SECRET_PATTERNS: SecretMatchPattern[] = [
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    severity: 'critical',
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}/g,
    severity: 'critical',
  },
  {
    name: 'GitHub Fine-Grained Token',
    regex: /github_pat_[a-zA-Z0-9_]{82}/g,
    severity: 'critical',
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP)?\s*PRIVATE KEY-----/g,
    severity: 'critical',
  },
  {
    name: 'OpenAI / Anthropic API Key',
    regex: /sk-(?:live|test|proj|ant)?[a-zA-Z0-9_-]{32,}/g,
    severity: 'critical',
  },
  {
    name: 'Slack Webhook URL',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,
    severity: 'high',
  },
  {
    name: 'Database Connection String with Credentials',
    regex: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^:\s]+:[^@\s]+@[a-zA-Z0-9.-]+/g,
    severity: 'critical',
  },
  {
    name: 'Generic API Key / Secret Assignment',
    regex: /(?:api[_-]?key|secret[_-]?key|auth[_-]?token|password|client[_-]?secret)\s*[:=]\s*['"][a-zA-Z0-9_~./+=]{16,}['"]/gi,
    severity: 'high',
  },
];

export interface SecretScanResult {
  hasSecret: boolean;
  blocked: boolean;
  warnings: string[];
  redactedWarnings: string[];
}

export function scanForSecrets(content: string, filePath?: string): SecretScanResult {
  if (!content || typeof content !== 'string') {
    return { hasSecret: false, blocked: false, warnings: [], redactedWarnings: [] };
  }

  const warnings: string[] = [];
  const redactedWarnings: string[] = [];

  for (const pattern of SECRET_PATTERNS) {
    // Reset regex state
    pattern.regex.lastIndex = 0;
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      const fileContext = filePath ? ` in ${filePath}` : '';
      const warning = `Potential ${pattern.name} detected${fileContext}`;
      warnings.push(warning);
      redactedWarnings.push(`[BLOCKED] Sensitive credential pattern detected (${pattern.name})${fileContext}`);
    }
  }

  // Also check sensitive file paths
  if (filePath) {
    const sensitiveFileRegex = /(^|[/\\])(\.env(?:\.local|\.production)?|id_rsa|id_ed25519|credentials\.json|service-account\.json)$/i;
    if (sensitiveFileRegex.test(filePath)) {
      warnings.push(`File path indicates sensitive configuration: ${filePath}`);
      redactedWarnings.push(`[BLOCKED] Sensitive configuration file found: ${filePath}`);
    }
  }

  const hasSecret = warnings.length > 0;
  return {
    hasSecret,
    blocked: hasSecret,
    warnings,
    redactedWarnings,
  };
}

export function sanitizeRedacted(text: string): string {
  if (!text) return '';
  let sanitized = text;
  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    sanitized = sanitized.replace(pattern.regex, '[REDACTED_SECRET]');
  }
  return sanitized;
}
