import { describe, expect, it, vi } from 'vitest';

import type { SparqlFetchResult } from './ukhpiSparql';
import { buildUkhpiTelemetry, logUkhpiResolutionTelemetry } from './ukhpiResolutionTelemetry';

describe('ukhpiResolutionTelemetry', () => {
  it('buildUkhpiTelemetry includes sparql and json counts', () => {
    const sparqlOk: SparqlFetchResult = {
      ok: true,
      map: new Map([['camden', { averagePriceGbp: 400_000, refMonth: '2025-01' }]]),
    };
    const t = buildUkhpiTelemetry(
      'averagePrice',
      performance.now() - 12,
      sparqlOk,
      {
        boroughsAttempted: 3,
        boroughsSucceeded: 2,
        boroughsFailed: 1,
        failedBoroughIdsSample: ['a'],
      },
      'ukhpi-linked-data',
    );
    expect(t.sparql.ok).toBe(true);
    expect(t.sparql.boroughCount).toBe(1);
    expect(t.jsonPath.boroughsFailed).toBe(1);
    expect(t.jsonPath.failedBoroughIdsSample).toEqual(['a']);
    expect(t.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('logUkhpiResolutionTelemetry prints JSON line', () => {
    const log = vi.spyOn(console, 'log').mockImplementation((): void => undefined);
    const sparqlFail: SparqlFetchResult = { ok: false, reason: 'http', httpStatus: 500 };
    logUkhpiResolutionTelemetry(
      buildUkhpiTelemetry(
        'averagePrice',
        performance.now(),
        sparqlFail,
        {
          boroughsAttempted: 0,
          boroughsSucceeded: 0,
          boroughsFailed: 0,
          failedBoroughIdsSample: [],
        },
        'static-london-borough-table',
      ),
    );
    expect(log.mock.calls[0]?.[0]).toContain('ukhpi_resolution');
    expect(log.mock.calls[0]?.[0]).toContain('"sparql"');
    log.mockRestore();
  });
});
