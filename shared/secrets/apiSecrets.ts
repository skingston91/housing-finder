/**
 * Optional JSON secret in AWS Secrets Manager (`API_SECRETS_ARN`), merged with plain Lambda env vars.
 * Plain env wins when set; otherwise values are read from the secret object.
 */

/** TfL keys are often pasted with a BOM, trailing newline, or line break in the middle — all break `app_key`. */
export const normalizeTflAppKey = (raw: string): string =>
  raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .trim();

let cachedJson: Record<string, string> | null | undefined;

export const clearApiSecretsCache = (): void => {
  cachedJson = undefined;
};

const loadSecretJson = async (): Promise<Record<string, string> | null> => {
  if (cachedJson !== undefined) {
    return cachedJson;
  }
  const arn = process.env.API_SECRETS_ARN?.trim();
  if (arn === undefined || arn === '') {
    cachedJson = null;
    return null;
  }
  try {
    const { GetSecretValueCommand, SecretsManagerClient } =
      await import('@aws-sdk/client-secrets-manager');
    const client = new SecretsManagerClient({});
    const out = await client.send(new GetSecretValueCommand({ SecretId: arn }));
    const raw = out.SecretString;
    if (raw === undefined || raw === '') {
      console.error(JSON.stringify({ component: 'api_secrets', error: 'empty_secret' }));
      cachedJson = null;
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      cachedJson = null;
      return null;
    }
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') {
        o[k] = v;
      }
    }
    cachedJson = o;
    return o;
  } catch (e) {
    console.error(
      JSON.stringify({
        component: 'api_secrets',
        error: 'get_secret_failed',
        message: e instanceof Error ? e.message : String(e),
      }),
    );
    cachedJson = null;
    return null;
  }
};

const normalizeSecretValue = (key: string, value: string): string =>
  key === 'TFL_APP_KEY' ? normalizeTflAppKey(value) : value.trim();

/** Prefer plain `process.env[key]`; otherwise optional Secrets Manager JSON field. */
export const resolveSecretString = async (key: string): Promise<string> => {
  const envRaw = process.env[key];
  if (envRaw !== undefined) {
    const v = normalizeSecretValue(key, envRaw);
    if (v !== '') {
      return v;
    }
  }
  const j = await loadSecretJson();
  const sec = j?.[key];
  return typeof sec === 'string' ? normalizeSecretValue(key, sec) : '';
};
