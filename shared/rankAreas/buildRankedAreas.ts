import { crimeScoreFromWeightedMonthlyAvg } from '../crime/crimeScoreFromWeightedMonthlyAvg';
import { recentMonthsYm } from '../crime/recentMonthsYm';
import { fetchStreetCrimes, sumWeightedCrimeCount } from '../policeUk/streetCrimes';
import { compositeScore } from '../scoring/compositeScore';
import type { RankedAreaDto, SearchAreasRequestBody } from '../searchAreasContract';
import { LONDON_AREA_CANDIDATES } from './candidates';

/** Cap months per area to limit police.uk calls (each month = one request). */
const MAX_CRIME_MONTHS = 6;

const stubDimensions = (
  body: SearchAreasRequestBody,
  index: number,
): Pick<RankedAreaDto['breakdown'], 'affordability' | 'commute' | 'schools'> => {
  const seed = body.maxPriceGbp % 97;
  const base = 45 + ((seed + index * 7) % 40);
  return {
    affordability: Math.min(100, base + (index % 5)),
    commute: Math.min(100, base + 3 - index),
    schools: Math.min(100, base + (index % 8)),
  };
};

const weightedCrimeForPoint = async (
  latitude: number,
  longitude: number,
  monthsYm: readonly string[],
  categoryWeights: Readonly<Record<string, number>>,
  fetchImpl: typeof fetch,
): Promise<{ total: number; months: number; failed: boolean }> => {
  let total = 0;
  let failed = false;
  for (const ym of monthsYm) {
    try {
      const crimes = await fetchStreetCrimes(latitude, longitude, ym, fetchImpl);
      total += sumWeightedCrimeCount(crimes, categoryWeights, 1);
    } catch {
      failed = true;
      break;
    }
  }
  return { total, months: monthsYm.length, failed };
};

/**
 * Rank candidate areas: **crime** from [data.police.uk](https://data.police.uk/) street-level API;
 * other dimensions remain stubs until Land Registry / routing / schools land.
 */
export const buildRankedAreas = async (
  body: SearchAreasRequestBody,
  fetchImpl: typeof fetch,
): Promise<readonly RankedAreaDto[]> => {
  const monthsYm = recentMonthsYm(body.crime.windowMonths, MAX_CRIME_MONTHS);
  const candidates = LONDON_AREA_CANDIDATES.slice(0, 10);

  const rows = await Promise.all(
    candidates.map(async (c, i) => {
      const { total, months, failed } = await weightedCrimeForPoint(
        c.latitude,
        c.longitude,
        monthsYm,
        body.crime.categoryWeights,
        fetchImpl,
      );
      const avg = months > 0 ? total / months : 0;
      const crime = failed ? 45 : crimeScoreFromWeightedMonthlyAvg(avg);
      const stub = stubDimensions(body, i);
      const breakdown = { ...stub, crime };
      const score = compositeScore(breakdown);
      const area: RankedAreaDto = {
        id: c.id,
        displayName: c.displayName,
        centroidLatitude: c.latitude,
        centroidLongitude: c.longitude,
        score,
        breakdown,
        metadata: {
          crimeWeightedTotal: total,
          crimeMonthsRequested: body.crime.windowMonths,
          crimeMonthsUsed: monthsYm.length,
          policeUk: failed ? 'error' : 'ok',
          dataPoliceUk: 'Contains police.uk data © UK law enforcement; locations approximate.',
        },
      };
      return area;
    }),
  );

  return [...rows].sort((a, b) => b.score - a.score);
};
