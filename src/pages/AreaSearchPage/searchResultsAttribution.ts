import type { RankedArea } from '@/domain/area/types';

import { formatIsoDateUtcUkLong } from '@shared/futureTransport/formatIsoDateUtcUkLong';

const affordabilityAndSchoolsSummary = (metadata: RankedArea['metadata']): string => {
  const src = metadata?.affordabilityPriceSource;
  let aff =
    'Affordability compares your budget to an indicative borough-level price reference for the nearest London borough (OGL-style disclosure).';
  if (src === 'ukhpi-linked-data' || src === 'ukhpi-partial-static-fallback') {
    aff =
      'Affordability compares your budget to HM Land Registry UK HPI average prices for the nearest London borough where available (OGL — discovery only). UK HPI publishes averages, not medians or street-level prices; it is indicative only, not a valuation.';
  }
  const proximityNote =
    metadata?.schoolsProximityModel === 'haversine-walk-estimate'
      ? ' Distance is straight-line (haversine) to establishment points; an optional school time cap uses estimated walk speed (5 km/h), not door-to-door routing.'
      : '';
  const statedPerfYear = metadata?.schoolsPerformanceAcademicYear;
  const perfYear =
    metadata?.schoolsModel === 'gias-open-data-sample-dfe-performance-urn-map' &&
    typeof statedPerfYear === 'string' &&
    statedPerfYear.trim().length > 0
      ? ` Stated performance data year: ${statedPerfYear.trim()}.`
      : '';
  const schools =
    metadata?.schoolsModel === 'gias-open-data-sample-dfe-performance-urn-map'
      ? ` Schools use distance to an expanded sample of London state-school-style coordinates (DfE/GIAS family, OGL — discovery only) and blend in performance signals from ingested DfE open-data CSVs keyed by school URN (indicative mapping — verify columns and year for your use case).${perfYear}${proximityNote}`
      : metadata?.schoolsModel === 'gias-open-data-sample-performance-seed-prototype'
        ? ` Schools use distance to an expanded sample of London state-school-style coordinates (DfE/GIAS family, OGL — discovery only) and blend in a prototype performance signal from seed metadata (replace with official DfE/open performance tables later).${proximityNote}`
        : metadata?.schoolsModel === 'gias-open-data-sample'
          ? ` Schools use distance to an expanded sample of London state-school-style coordinates (DfE/GIAS family, OGL — discovery only).${proximityNote}`
          : ` Schools use distance to a small reference seed set.${proximityNote}`;
  return `${aff}${schools}`;
};

const tflTransitFailureHint = (code: string): string => {
  const hints: Readonly<Record<string, string>> = {
    empty_journeys:
      ' TfL returned no journeys for that origin/destination (the app retries with a wider search when the first call is empty). Check coordinates and that the workplace is reachable on the modes we request.',
    no_journey_after_filters:
      ' No journey satisfied your transit filters (avoided lines, multiple-route requirement, or single rail leg).',
    http_error: ' The TfL API returned an HTTP error (rate limit, key, or outage).',
    json_parse_error: ' The TfL response could not be parsed as JSON.',
    invalid_payload: ' The TfL response had an unexpected shape.',
    timeout: ' The TfL request timed out.',
  };
  return hints[code] ?? ` (${code}).`;
};

const commuteSummary = (metadata: RankedArea['metadata']): string => {
  if (!metadata || metadata.stub === 1) {
    return ' Commute uses straight-line distance with mode speed assumptions—not live routing.';
  }
  if (metadata.commuteModel === 'tfl-unified-api') {
    const plannerLine =
      typeof metadata.commuteTflPlannerSummary === 'string' &&
      metadata.commuteTflPlannerSummary.trim() !== ''
        ? ` ${metadata.commuteTflPlannerSummary.trim()}`
        : ' Commute (transit) uses Transport for London journey planning (TFL_APP_KEY on the search Lambda; TfL requires app_key only). Unless you set date and time (or opt out), the planner uses the next eligible weekday 08:30 departure in Europe/London; requests use timetable-style options (useRealTimeLiveArrivals=false, walkingSpeed=average), not live departure boards.';
    const parts: string[] = [plannerLine];
    if (metadata.commuteTflDurationMethod === 'median-first-three-qualifying') {
      parts.push(
        'Duration uses the median of up to the first three qualifying journey options TfL returns for that origin/destination (same filters).',
      );
    }
    if (typeof metadata.commuteTflDisruptionHint === 'string') {
      parts.push(metadata.commuteTflDisruptionHint.trim());
    }
    if (typeof metadata.commuteAlternativeJourneyMinutes === 'number') {
      parts.push(
        `A second acceptable TfL option was about ${String(metadata.commuteAlternativeJourneyMinutes)} minutes.`,
      );
    }
    if (metadata.commuteTflNationalSearchUsed === 1) {
      parts.push('That journey used TfL national search (wider geographic scope).');
    }
    if (
      typeof metadata.commuteReliabilityFactor === 'number' &&
      Number.isFinite(metadata.commuteReliabilityFactor) &&
      metadata.commuteReliabilityFactor < 1
    ) {
      parts.push(
        `Commute score was scaled by ${metadata.commuteReliabilityFactor.toFixed(3)} for disruption or route volatility.`,
      );
    }
    return parts.join(' ');
  }
  if (metadata.commuteModel === 'tfl-fallback-straight-line') {
    const code =
      typeof metadata.commuteTflFailureCode === 'string' ? metadata.commuteTflFailureCode : '';
    const detail = code.length > 0 ? tflTransitFailureHint(code) : '';
    return ` Commute (transit) fell back to straight-line time after TfL could not supply a usable journey.${detail}`;
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

/** One-line honesty hint for affordability (UK HPI vs static table) from the first result. */
export const firstAffordabilityDiscoveryHint = (
  areas: readonly RankedArea[],
): string | undefined => {
  const src = areas[0]?.metadata?.affordabilityPriceSource;
  if (src === 'ukhpi-linked-data' || src === 'ukhpi-partial-static-fallback') {
    return 'Affordability uses HM Land Registry UK HPI borough averages (not medians or address-level prices). Indicative discovery only—not a valuation.';
  }
  if (src === 'static-london-borough-table') {
    return 'Affordability uses a static in-repo London borough reference table when live HPI is off—indicative only.';
  }
  return undefined;
};

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
/** True if any ranked area used a straight-line or routing fallback for commute (not full TfL/ORS route). */
export const resultsUseStraightLineCommute = (areas: readonly RankedArea[]): boolean => {
  for (const a of areas) {
    const m = a.metadata?.commuteModel;
    if (
      m === 'straight-line-time-estimate' ||
      m === 'tfl-fallback-straight-line' ||
      m === 'openrouteservice-fallback-straight-line'
    ) {
      return true;
    }
  }
  return false;
};

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

/** When API returns planned-transport spike metadata, explain straight-line waypoint proximity. */
export const firstFutureTransportMethodologyNote = (
  areas: readonly RankedArea[],
): string | undefined => {
  for (const a of areas) {
    if (a.metadata?.futureTransportModel === 'london-planned-point-proximity-v1') {
      const checked =
        typeof a.metadata.futureTransportDataLastReviewed === 'string' &&
        a.metadata.futureTransportDataLastReviewed.trim() !== ''
          ? ` Waypoint list last checked: ${formatIsoDateUtcUkLong(a.metadata.futureTransportDataLastReviewed)}.`
          : '';
      return `Planned transport proximity (Greater London spike): straight-line distance to the nearest curated waypoint for publicly discussed schemes (see per-card source links); illustrative only—not a delivery date, engineering alignment, or part of the headline score.${checked}`;
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
