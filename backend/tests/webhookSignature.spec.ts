import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../src/services/github/githubService';

describe('GitHub Webhook Signature Verification', () => {
  const secret = 'super-secret-webhook-key-12345';
  const payload = JSON.stringify({ ref: 'refs/heads/main', repository: { name: 'test-repo' } });

  it('accepts valid HMAC SHA-256 signature', () => {
    const validHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const header = `sha256=${validHmac}`;

    const isValid = verifyWebhookSignature(payload, header, secret);
    expect(isValid).toBe(true);
  });

  it('rejects tampered payload', () => {
    const validHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const header = `sha256=${validHmac}`;

    const tamperedPayload = JSON.stringify({ ref: 'refs/heads/main', repository: { name: 'tampered-repo' } });
    const isValid = verifyWebhookSignature(tamperedPayload, header, secret);
    expect(isValid).toBe(false);
  });

  it('rejects incorrect secret', () => {
    const validHmac = crypto.createHmac('sha256', 'wrong-secret').update(payload).digest('hex');
    const header = `sha256=${validHmac}`;

    const isValid = verifyWebhookSignature(payload, header, secret);
    expect(isValid).toBe(false);
  });

  it('rejects missing or malformed signature header', () => {
    expect(verifyWebhookSignature(payload, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, 'invalid-prefix-123', secret)).toBe(false);
  });
});
