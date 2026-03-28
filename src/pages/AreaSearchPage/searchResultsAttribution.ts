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
  if (metadata.candidateMode === 'fixed-london') {
    if (metadata.policeUk === 'ok') {
      return 'Crime uses anonymised data.police.uk data near each point. Your workplace is outside our Greater London preview box, so these are fixed London centroids—not a grid around work. Affordability, commute, and schools remain placeholders.';
    }
    if (metadata.policeUk === 'error') {
      return 'Workplace is outside our Greater London preview box; we used fixed London centroids. Crime used a fallback after a police.uk error. Other dimensions remain placeholders.';
    }
    return 'Workplace is outside our Greater London preview box; candidate areas are fixed London centroids. Affordability, commute, and schools remain placeholders.';
  }
  if (metadata.policeUk === 'ok') {
    const grid =
      metadata.candidateMode === 'workplace-grid'
        ? ' Candidates are sampled on a grid around your workplace (Greater London).'
        : '';
    return `Crime uses anonymised street-level data from data.police.uk near this point.${grid} Affordability, commute, and schools are still placeholders until those feeds are wired.`;
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
