import type { UkhpiAveragePriceKey } from './ukhpiAveragePriceKey';
import { fetchLondonBoroughUkhpiObservationPrices } from './ukhpiHistoricalObservationSparql';
import { refMonthMinusYears } from './ukhpiRefMonth';
import type { SparqlBoroughPriceMap } from './ukhpiSparql';

/**
 * Computes **year-on-year % change** in UK HPI average price per borough (latest observation vs same
 * calendar month one year earlier). Requires the **latest** SPARQL map from
 * {@link resolveLondonBoroughMedianRows}.
 */
export const resolveLondonBoroughYoYPctByBoroughId = async (
  fetchImpl: typeof fetch,
  priceKey: UkhpiAveragePriceKey,
  latestByBoroughId: SparqlBoroughPriceMap | undefined,
): Promise<ReadonlyMap<string, number | null>> => {
  const out = new Map<string, number | null>();
  if (latestByBoroughId === undefined || latestByBoroughId.size === 0) {
    return out;
  }
  const pairs: { readonly boroughId: string; readonly refMonth: string }[] = [];
  for (const [boroughId, live] of latestByBoroughId) {
    const priorMonth = refMonthMinusYears(live.refMonth, 1);
    pairs.push({ boroughId, refMonth: priorMonth });
  }
  const priorPrices = await fetchLondonBoroughUkhpiObservationPrices(fetchImpl, priceKey, pairs);
  if (priorPrices === null) {
    for (const [boroughId] of latestByBoroughId) {
      out.set(boroughId, null);
    }
    return out;
  }
  for (const [boroughId, live] of latestByBoroughId) {
    const prior = priorPrices.get(boroughId);
    if (prior === undefined || prior <= 0) {
      out.set(boroughId, null);
      continue;
    }
    const latest = live.averagePriceGbp;
    const yoyPct = ((latest - prior) / prior) * 100;
    out.set(boroughId, Number.isFinite(yoyPct) ? yoyPct : null);
  }
  return out;
};
