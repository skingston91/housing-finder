import type { SearchAreasRequestBody, SearchAreasResponse } from '@shared/searchAreasContract';

const parseJsonResponse = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Response was not valid JSON');
  }
};

const isSearchAreasResponse = (v: unknown): v is SearchAreasResponse => {
  if (typeof v !== 'object' || v === null || !('areas' in v)) {
    return false;
  }
  const areas = (v as { areas: unknown }).areas;
  return Array.isArray(areas);
};

export const postSearchAreas = async (
  body: SearchAreasRequestBody,
  fetchImpl: typeof fetch = fetch,
): Promise<SearchAreasResponse> => {
  const res = await fetchImpl('/api/search-areas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await parseJsonResponse(res);

  if (!res.ok) {
    const msg =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Request failed (${String(res.status)})`;
    throw new Error(msg);
  }

  if (!isSearchAreasResponse(payload)) {
    throw new Error('Invalid response shape from search-areas');
  }

  return payload;
};
