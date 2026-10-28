/**
 * Prompt Injection Defense & Data Sanitization
 * Treats repository content strictly as untrusted data inside explicit boundaries.
 */

export function sanitizeUntrustedInput(content: string, maxBytes: number = 24000): string {
  if (!content) return '';

  // Limit input size to prevent context overflow & excessive token costs
  let truncated = content;
  if (Buffer.byteLength(truncated, 'utf8') > maxBytes) {
    truncated = truncated.slice(0, maxBytes) + '\n\n...[Content truncated for analysis safety & token limits]...';
  }

  // Defend against common injection phrases attempting to override system behavior
  const neutralized = truncated
    .replace(/(system prompt|ignore previous instructions|you are now|disregard instructions)/gi, '[FLAGGED_INSTRUCTION_ATTEMPT]')
    .replace(/```(?:json)?/g, '` ` `'); // Avoid breaking outer markdown/json boundaries

  return neutralized;
}

export function buildSafeAIContextBlock(tag: string, content: string): string {
  const sanitized = sanitizeUntrustedInput(content);
  return `<UNTRUSTED_REPOSITORY_DATA name="${tag}">\n${sanitized}\n</UNTRUSTED_REPOSITORY_DATA>`;
}
