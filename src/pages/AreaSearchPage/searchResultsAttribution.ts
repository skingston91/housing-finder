import type { RankedArea } from '@/domain/area/types';

const affordabilitySchoolsSummary =
  'Affordability compares your budget to an indicative median for the nearest London borough (OGL-style disclosure). Schools use distance to a small reference seed set.';

const commuteSummary = (metadata: RankedArea['metadata']): string => {
  if (!metadata || metadata.stub === 1) {
    return ' Commute uses straight-line distance with mode speed assumptions—not live routing.';
  }
  if (metadata.commuteModel === 'tfl-unified-api') {
    return ' Commute (transit) uses Transport for London journey planning (TFL_APP_KEY on the search Lambda; TfL requires app_key only).';
  }
  if (metadata.commuteModel === 'tfl-fallback-straight-line') {
    return ' Commute (transit) fell back to straight-line time after TfL returned no journey.';
  }
  if (metadata.commuteModel === 'openrouteservice-directions') {
    return ' Commute (drive/cycle/walk) uses OpenRouteService directions (ORS_API_KEY on the search Lambda).';
  }
  if (metadata.commuteModel === 'openrouteservice-fallback-straight-line') {
    return ' Commute (drive/cycle/walk) fell back to straight-line time after OpenRouteService returned no route.';
  }
  return ' Commute uses straight-line distance with mode speed assumptions—not live routing.';
};

const proxyBlock = (metadata: RankedArea['metadata']): string =>
  `${affordabilitySchoolsSummary}${commuteSummary(metadata)}`;

/** First non-empty `dataPoliceUk` string across results (shared attribution line). */
export const firstDataPoliceUkAttribution = (areas: readonly RankedArea[]): string | undefined => {
  for (const a of areas) {
    const v = a.metadata?.dataPoliceUk;
    if (typeof v === 'string' && v.trim().length > 0) {
      return v;
    }
  }
  return undefined;
};

/** First non-empty `landRegistryOgl` string across results (shared OGL line for affordability proxy). */
export const firstLandRegistryOglAttribution = (
  areas: readonly RankedArea[],
): string | undefined => {
  for (const a of areas) {
    const v = a.metadata?.landRegistryOgl;
    if (typeof v === 'string' && v.trim().length > 0) {
      return v;
    }
  }
  return undefined;
};

export const areaProvenanceDescription = (metadata: RankedArea['metadata']): string => {
  if (!metadata) {
    return 'Scores combine multiple signals; more detail will appear as data sources are connected.';
  }
  if (metadata.stub === 1) {
    return `Demo ranking: crime is still a simple placeholder. ${proxyBlock(metadata)} Run the local API for live police.uk-backed crime.`;
  }
  if (metadata.candidateMode === 'fixed-london') {
    if (metadata.policeUk === 'ok') {
      return `Crime uses anonymised data.police.uk data near each point. Your workplace is outside our Greater London preview box, so these are fixed London centroids—not a grid around work. ${proxyBlock(metadata)}`;
    }
    if (metadata.policeUk === 'error') {
      return `Workplace is outside our Greater London preview box; we used fixed London centroids. Crime used a fallback after a police.uk error. ${proxyBlock(metadata)}`;
    }
    return `Workplace is outside our Greater London preview box; candidate areas are fixed London centroids. ${proxyBlock(metadata)}`;
  }
  if (metadata.policeUk === 'ok') {
    const grid =
      metadata.candidateMode === 'workplace-grid'
        ? ' Candidates are sampled on a grid around your workplace (Greater London).'
        : '';
    return `Crime uses anonymised street-level data from data.police.uk near this point.${grid} ${proxyBlock(metadata)}`;
  }
  if (metadata.policeUk === 'error') {
    return `Crime score used a fallback because the police.uk request failed. ${proxyBlock(metadata)}`;
  }
  return `Composite combines multiple dimensions. ${proxyBlock(metadata)}`;
};

export const hasCrimeMetadataDetails = (metadata: RankedArea['metadata']): boolean =>
  Boolean(
    metadata &&
    metadata.stub !== 1 &&
    (typeof metadata.crimeWeightedTotal === 'number' ||
      typeof metadata.crimeMonthsUsed === 'number' ||
      metadata.policeUk === 'ok' ||
      metadata.policeUk === 'error'),
  );
