import type { RankedArea } from '@/domain/area/types';

const affordabilityAndSchoolsSummary = (metadata: RankedArea['metadata']): string => {
  const src = metadata?.affordabilityPriceSource;
  let aff =
    'Affordability compares your budget to an indicative median for the nearest London borough (OGL-style disclosure).';
  if (src === 'ukhpi-linked-data' || src === 'ukhpi-partial-static-fallback') {
    aff =
      'Affordability compares your budget to HM Land Registry UK HPI average prices for the nearest London borough where available (OGL — discovery only).';
  }
  const statedPerfYear = metadata?.schoolsPerformanceAcademicYear;
  const perfYear =
    metadata?.schoolsModel === 'gias-open-data-sample-dfe-performance-urn-map' &&
    typeof statedPerfYear === 'string' &&
    statedPerfYear.trim().length > 0
      ? ` Stated performance data year: ${statedPerfYear.trim()}.`
      : '';
  const schools =
    metadata?.schoolsModel === 'gias-open-data-sample-dfe-performance-urn-map'
      ? ` Schools use distance to an expanded sample of London state-school-style coordinates (DfE/GIAS family, OGL — discovery only) and blend in performance signals from ingested DfE open-data CSVs keyed by school URN (indicative mapping — verify columns and year for your use case).${perfYear}`
      : metadata?.schoolsModel === 'gias-open-data-sample-performance-seed-prototype'
        ? ' Schools use distance to an expanded sample of London state-school-style coordinates (DfE/GIAS family, OGL — discovery only) and blend in a prototype performance signal from seed metadata (replace with official DfE/open performance tables later).'
        : metadata?.schoolsModel === 'gias-open-data-sample'
          ? ' Schools use distance to an expanded sample of London state-school-style coordinates (DfE/GIAS family, OGL — discovery only).'
          : ' Schools use distance to a small reference seed set.';
  return `${aff}${schools}`;
};

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
  `${affordabilityAndSchoolsSummary(metadata)}${commuteSummary(metadata)}`;

/** First non-empty `schoolsDataAttribution` string across results (shared OGL/DfE line). */
export const firstSchoolsDataAttribution = (areas: readonly RankedArea[]): string | undefined => {
  for (const a of areas) {
    const v = a.metadata?.schoolsDataAttribution;
    if (typeof v === 'string' && v.trim().length > 0) {
      return v;
    }
  }
  return undefined;
};

export const firstSchoolsCoverageHint = (areas: readonly RankedArea[]): string | undefined => {
  for (const a of areas) {
    const pct = a.metadata?.schoolsPerformanceCoveragePct;
    const matched = a.metadata?.schoolsPointsMatchedByUrn;
    const withUrn = a.metadata?.schoolsPointsWithUrn;
    if (
      typeof pct === 'number' &&
      Number.isFinite(pct) &&
      typeof matched === 'number' &&
      Number.isFinite(matched) &&
      typeof withUrn === 'number' &&
      Number.isFinite(withUrn)
    ) {
      return `Schools performance join coverage: ${pct.toFixed(1)}% (${matched.toString()}/${withUrn.toString()} URN-matched points).`;
    }
  }
  return undefined;
};

export const firstSchoolsPerformanceYearHint = (
  areas: readonly RankedArea[],
): string | undefined => {
  for (const a of areas) {
    const y = a.metadata?.schoolsPerformanceAcademicYear;
    if (typeof y === 'string' && y.trim().length > 0) {
      return `School performance data year: ${y.trim()}.`;
    }
  }
  return 'School performance data year is not set.';
};

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
