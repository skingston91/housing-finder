import type { UkhpiAveragePriceKey } from './ukhpiAveragePriceKey';
import { UKHPI_REGION_SLUG_BY_BOROUGH_ID } from './ukhpiRegionSlugByBoroughId';

const SPARQL_ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query';

const REGION_IRI_PREFIX = 'http://landregistry.data.gov.uk/id/region/';

/** Slug from `…/id/region/{slug}` URI (path last segment). */
export const regionSlugFromUkhpiRegionUri = (uri: string): string | null => {
  try {
    const u = new URL(uri);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return last !== undefined && last.length > 0 ? decodeURIComponent(last) : null;
  } catch {
    return null;
  }
};

const slugToInternalBoroughId = (slug: string): string | undefined => {
  for (const [id, s] of Object.entries(UKHPI_REGION_SLUG_BY_BOROUGH_ID)) {
    if (s === slug) {
      return id;
    }
  }
  return undefined;
};

export const buildLondonBoroughUkhpiSparqlQuery = (
  priceKey: UkhpiAveragePriceKey = 'averagePrice',
): string => {
  const iris = [
    ...new Set(
      Object.values(UKHPI_REGION_SLUG_BY_BOROUGH_ID).map((slug) => `<${REGION_IRI_PREFIX}${slug}>`),
    ),
  ].join(' ');
  return `PREFIX ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>
SELECT ?regionUri ?price ?month WHERE {
  {
    SELECT ?regionUri (MAX(?m) AS ?month) WHERE {
      ?obs ukhpi:refRegion ?regionUri .
      ?obs ukhpi:refMonth ?m .
      VALUES ?regionUri { ${iris} }
    }
    GROUP BY ?regionUri
  }
  ?obs2 ukhpi:refRegion ?regionUri .
  ?obs2 ukhpi:refMonth ?month .
  ?obs2 ukhpi:${priceKey} ?price .
}`;
};

interface SparqlBinding {
  readonly regionUri?: { readonly value: string };
  readonly price?: { readonly value: string };
  readonly month?: { readonly value: string };
}

const parseSparqlJson = (
  json: unknown,
): ReadonlyMap<string, { readonly averagePriceGbp: number; readonly refMonth: string }> | null => {
  if (typeof json !== 'object' || json === null) {
    return null;
  }
  const results = (json as Record<string, unknown>).results;
  if (typeof results !== 'object' || results === null) {
    return null;
  }
  const bindings = (results as Record<string, unknown>).bindings;
  if (!Array.isArray(bindings)) {
    return null;
  }
  const out = new Map<string, { averagePriceGbp: number; refMonth: string }>();
  for (const raw of bindings) {
    if (typeof raw !== 'object' || raw === null) {
      continue;
    }
    const b = raw as SparqlBinding;
    const uri = b.regionUri?.value;
    const priceStr = b.price?.value;
    const month = b.month?.value;
    if (uri === undefined || priceStr === undefined || month === undefined) {
      continue;
    }
    const slug = regionSlugFromUkhpiRegionUri(uri);
    if (slug === null) {
      continue;
    }
    const boroughId = slugToInternalBoroughId(slug);
    if (boroughId === undefined) {
      continue;
    }
    const price = Number.parseInt(priceStr, 10);
    if (!Number.isFinite(price) || price <= 0) {
      continue;
    }
    out.set(boroughId, { averagePriceGbp: price, refMonth: month });
  }
  return out;
};

export type SparqlBoroughPriceMap = ReadonlyMap<
  string,
  { readonly averagePriceGbp: number; readonly refMonth: string }
>;

export type SparqlFetchResult =
  | { readonly ok: true; readonly map: SparqlBoroughPriceMap }
  | {
      readonly ok: false;
      readonly reason: 'http' | 'json_parse';
      readonly httpStatus: number;
    };

/**
 * One SPARQL request: latest UK HPI **average** price per London borough (VALUES-filtered regions).
 */
export const fetchLondonBoroughUkhpiPricesViaSparql = async (
  fetchImpl: typeof fetch,
  priceKey: UkhpiAveragePriceKey = 'averagePrice',
): Promise<SparqlFetchResult> => {
  const query = buildLondonBoroughUkhpiSparqlQuery(priceKey);
  const body = new URLSearchParams({ query });
  const res = await fetchImpl(SPARQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    return { ok: false, reason: 'http', httpStatus: res.status };
  }
  let json: unknown;
  try {
    json = (await res.json()) as unknown;
  } catch {
    return { ok: false, reason: 'json_parse', httpStatus: res.status };
  }
  const map = parseSparqlJson(json);
  if (map === null) {
    return { ok: false, reason: 'json_parse', httpStatus: res.status };
  }
  return { ok: true, map };
};
