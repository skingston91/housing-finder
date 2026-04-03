import type { UkhpiAveragePriceKey } from './ukhpiAveragePriceKey';
import { UKHPI_REGION_SLUG_BY_BOROUGH_ID } from './ukhpiRegionSlugByBoroughId';
import { regionSlugFromUkhpiRegionUri } from './ukhpiSparql';

const SPARQL_ENDPOINT = 'https://landregistry.data.gov.uk/landregistry/query';

const REGION_IRI_PREFIX = 'http://landregistry.data.gov.uk/id/region/';

const slugToInternalBoroughId = (slug: string): string | undefined => {
  for (const [id, s] of Object.entries(UKHPI_REGION_SLUG_BY_BOROUGH_ID)) {
    if (s === slug) {
      return id;
    }
  }
  return undefined;
};

interface SparqlBinding {
  readonly regionUri?: { readonly value: string };
  readonly price?: { readonly value: string };
}

export const buildLondonBoroughUkhpiObservationSparqlQuery = (
  priceKey: UkhpiAveragePriceKey,
  pairs: readonly { readonly boroughId: string; readonly refMonth: string }[],
): string => {
  const valueRows = pairs
    .map(({ boroughId, refMonth }) => {
      const slug = UKHPI_REGION_SLUG_BY_BOROUGH_ID[boroughId];
      if (slug === undefined) {
        return '';
      }
      const uri = `<${REGION_IRI_PREFIX}${slug}>`;
      return `(${uri} "${refMonth}"^^xsd:gYearMonth)`;
    })
    .filter((s) => s.length > 0)
    .join(' ');
  return `PREFIX ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>
SELECT ?regionUri ?price ?month WHERE {
  VALUES (?regionUri ?month) { ${valueRows} }
  ?obs ukhpi:refRegion ?regionUri .
  ?obs ukhpi:refMonth ?month .
  ?obs ukhpi:${priceKey} ?price .
}`;
};

const parseObservationSparqlJson = (json: unknown): ReadonlyMap<string, number> | null => {
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
  const out = new Map<string, number>();
  for (const raw of bindings) {
    if (typeof raw !== 'object' || raw === null) {
      continue;
    }
    const b = raw as SparqlBinding;
    const uri = b.regionUri?.value;
    const priceStr = b.price?.value;
    if (uri === undefined || priceStr === undefined) {
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
    out.set(boroughId, price);
  }
  return out;
};

export const fetchLondonBoroughUkhpiObservationPrices = async (
  fetchImpl: typeof fetch,
  priceKey: UkhpiAveragePriceKey,
  pairs: readonly { readonly boroughId: string; readonly refMonth: string }[],
): Promise<ReadonlyMap<string, number> | null> => {
  if (pairs.length === 0) {
    return new Map();
  }
  const query = buildLondonBoroughUkhpiObservationSparqlQuery(priceKey, pairs);
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
    return null;
  }
  let json: unknown;
  try {
    json = (await res.json()) as unknown;
  } catch {
    return null;
  }
  return parseObservationSparqlJson(json);
};
