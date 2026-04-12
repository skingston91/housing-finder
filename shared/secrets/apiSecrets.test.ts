import { afterEach, describe, expect, it } from 'vitest';

import { clearApiSecretsCache, normalizeTflAppKey, resolveSecretString } from './apiSecrets';

describe('normalizeTflAppKey', () => {
  it('strips BOM and line breaks often introduced when copying the key', () => {
    expect(normalizeTflAppKey('\uFEFFabc123\n')).toBe('abc123');
    expect(normalizeTflAppKey('abc\r\n123')).toBe('abc123');
    expect(normalizeTflAppKey('  xy z  ')).toBe('xy z');
  });
});

describe('resolveSecretString', () => {
  afterEach(() => {
    delete process.env.TFL_APP_KEY;
    delete process.env.API_SECRETS_ARN;
    clearApiSecretsCache();
  });

  it('normalizes TFL_APP_KEY from env', async () => {
    process.env.TFL_APP_KEY = '\uFEFFmy-key\n';
    expect(await resolveSecretString('TFL_APP_KEY')).toBe('my-key');
  });
});
