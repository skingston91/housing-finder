import type { RankedAreaDto } from '@shared/searchAreasContract';

/** First non-empty `dataPoliceUk` string across results (shared attribution line). */
export const firstDataPoliceUkAttribution = (
  areas: readonly RankedAreaDto[],
): string | undefined => {
  for (const a of areas) {
    const v = a.metadata?.dataPoliceUk;
    if (typeof v === 'string' && v.trim().length > 0) {
      return v;
    }
  }
  return undefined;
};

export const areaProvenanceDescription = (metadata: RankedAreaDto['metadata']): string => {
  if (!metadata) {
    return 'Scores combine multiple signals; more detail will appear as data sources are connected.';
  }
  if (metadata.stub === 1) {
    return 'Demo ranking: all dimensions use simple placeholders. Run the local API (see empty-state hint) for live crime-aware rankings.';
  }
  if (metadata.policeUk === 'ok') {
    return 'Crime uses anonymised street-level data from data.police.uk near this point. Affordability, commute, and schools are still placeholders until those feeds are wired.';
  }
  if (metadata.policeUk === 'error') {
    return 'Crime score used a fallback because the police.uk request failed. Affordability, commute, and schools remain placeholders.';
  }
  return 'Composite combines multiple dimensions; some may still use placeholders.';
};

export const hasCrimeMetadataDetails = (metadata: RankedAreaDto['metadata']): boolean =>
  Boolean(
    metadata &&
    metadata.stub !== 1 &&
    (typeof metadata.crimeWeightedTotal === 'number' ||
      typeof metadata.crimeMonthsUsed === 'number' ||
      metadata.policeUk === 'ok' ||
      metadata.policeUk === 'error'),
  );
