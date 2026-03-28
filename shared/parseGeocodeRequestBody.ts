import type { GeocodeWorkplaceRequestBody } from './geocodeContract';

export const parseGeocodeRequestBody = (
  raw: unknown,
):
  | { readonly ok: true; readonly value: GeocodeWorkplaceRequestBody }
  | { readonly ok: false; readonly error: string } => {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Expected JSON object' };
  }
  const q = (raw as { q?: unknown }).q;
  if (typeof q !== 'string' || q.trim().length < 2) {
    return { ok: false, error: 'q must be a non-empty string (at least 2 characters)' };
  }
  return { ok: true, value: { q: q.trim() } };
};
