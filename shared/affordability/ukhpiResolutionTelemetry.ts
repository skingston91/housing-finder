import type { AffordabilityMedianPriceSource } from './affordabilityMedianPriceSource';
import type { UkhpiAveragePriceKey } from './ukhpiAveragePriceKey';
import type { SparqlFetchResult } from './ukhpiSparql';

export interface UkhpiResolutionTelemetry {
  readonly priceKey: UkhpiAveragePriceKey;
  readonly durationMs: number;
  readonly sparql: {
    readonly ok: boolean;
    readonly httpStatus?: number;
    readonly boroughCount: number;
    readonly reason?: 'http' | 'json_parse';
  };
  readonly jsonPath: {
    readonly boroughsAttempted: number;
    readonly boroughsSucceeded: number;
    readonly boroughsFailed: number;
    readonly failedBoroughIdsSample: readonly string[];
  };
  readonly priceSource: AffordabilityMedianPriceSource;
}

const summarizeSparql = (result: SparqlFetchResult): UkhpiResolutionTelemetry['sparql'] => {
  if (result.ok) {
    return { ok: true, boroughCount: result.map.size };
  }
  return {
    ok: false,
    boroughCount: 0,
    httpStatus: result.httpStatus,
    reason: result.reason,
  };
};

export const buildUkhpiTelemetry = (
  priceKey: UkhpiAveragePriceKey,
  startedAt: number,
  sparqlResult: SparqlFetchResult,
  jsonPath: UkhpiResolutionTelemetry['jsonPath'],
  priceSource: AffordabilityMedianPriceSource,
): UkhpiResolutionTelemetry => ({
  priceKey,
  durationMs: Math.round(performance.now() - startedAt),
  sparql: summarizeSparql(sparqlResult),
  jsonPath,
  priceSource,
});

/** Structured line for CloudWatch / log aggregation (no PII). */
export const logUkhpiResolutionTelemetry = (t: UkhpiResolutionTelemetry): void => {
  console.log(
    JSON.stringify({
      component: 'ukhpi_resolution',
      priceKey: t.priceKey,
      durationMs: t.durationMs,
      sparql: t.sparql,
      jsonPath: t.jsonPath,
      priceSource: t.priceSource,
    }),
  );
};
