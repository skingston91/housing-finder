import { Alert, Badge, Box, Button, Card, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';

import { formatCommuteJourneyDurationForDisplay } from '@shared/commute/formatCommuteJourneyDurationForDisplay';
import { formatIsoDateUtcUkLong } from '@shared/futureTransport/formatIsoDateUtcUkLong';
import { schoolsDimensionExplanationLine } from '@shared/schools/schoolsDimensionExplanation';

import { commuteModelDisplayLabel } from './commuteModelLabels';
import { SIZE_FIT_SCORE_DETAILS_READING, sizeFitResultCardExplainer } from './sizeFitUserContext';
import { isSizeFitSecondScoreActive } from './sizeFitSearchActive';
import {
  commuteDimensionExplanationLine,
  priceTrendDimensionExplanationLine,
} from './dimensionExplainerLines';
import { parseCommuteTflHttpStatusFromMetadata } from '@/adapters/mapSearchAreasContract';
import { describeTflHttpFailureAdvice } from '@shared/commute/tflCommuteFailureUserMessage';
import { areaProvenanceDescription, hasCrimeMetadataDetails } from './searchResultsAttribution';
import { commuteRankTierFromArea } from './commuteRouteConfirmation';
import { ScoreBar } from './ScoreBar';

export interface AreaResultCardProps {
  readonly area: RankedArea;
  readonly isSelected?: boolean;
  readonly onSelectArea?: (id: string) => void;
  /** Removes this row from the visible list (does not change server ranking). */
  readonly onHideFromList?: () => void;
  readonly compare?: {
    readonly isInCompare: boolean;
    readonly onToggle: () => void;
    readonly limitReached: boolean;
  };
}

const ResultScoreDetails = ({ area }: { area: RankedArea }) => {
  const m = area.metadata;
  if (!m) {
    return null;
  }
  const rows: { label: string; value: string }[] = [];
  if (typeof m.affordabilityBorough === 'string') {
    rows.push({ label: 'Affordability (borough reference)', value: m.affordabilityBorough });
  }
  if (m.policeUk === 'error') {
    rows.push({
      label: 'Crime street-level data',
      value: 'Unavailable — placeholder score only (not comparable to areas with police.uk OK).',
    });
  }
  if (m.policeUk === 'partial') {
    const missing = typeof m.crimeMonthsPartial === 'number' ? m.crimeMonthsPartial : undefined;
    rows.push({
      label: 'Crime street-level data',
      value:
        missing !== undefined
          ? `Partial — ${String(missing)} month(s) failed to load; the score uses the months that succeeded.`
          : 'Partial — some months failed to load; the score uses the months that succeeded.',
    });
  }
  if (hasCrimeMetadataDetails(m)) {
    if (typeof m.crimeMonthsRequested === 'number') {
      rows.push({
        label: 'Crime window requested',
        value: `${String(m.crimeMonthsRequested)} months`,
      });
    }
    if (typeof m.crimeMonthsUsed === 'number') {
      const cap = typeof m.crimeWindowCapMonths === 'number' ? m.crimeWindowCapMonths : undefined;
      const requested =
        typeof m.crimeMonthsRequested === 'number' ? m.crimeMonthsRequested : undefined;
      const capSuffix =
        cap !== undefined && requested !== undefined && requested > cap
          ? ` (max ${String(cap)} per search)`
          : '';
      const partialSuffix =
        m.policeUk === 'partial' && typeof m.crimeMonthsPartial === 'number'
          ? ` — ${String(m.crimeMonthsPartial)} month(s) unavailable`
          : '';
      rows.push({
        label: 'Months used in score',
        value: `${String(m.crimeMonthsUsed)}${capSuffix}${partialSuffix}`,
      });
    }
    if (typeof m.crimeWeightedTotal === 'number') {
      rows.push({
        label: 'Weighted incidents (sum over months)',
        value: String(m.crimeWeightedTotal),
      });
    }
    if (m.policeUk === 'ok' || m.policeUk === 'partial' || m.policeUk === 'error') {
      rows.push({ label: 'Police.uk fetch', value: m.policeUk });
    }
  }
  if (typeof m.commuteModel === 'string') {
    rows.push({
      label: 'Commute model',
      value: commuteModelDisplayLabel(m.commuteModel),
    });
  }
  if (m.commuteRoutingConfidence === 'low' || m.commuteRoutingConfidence === 'high') {
    rows.push({
      label: 'Commute routing confidence',
      value:
        m.commuteRoutingConfidence === 'low'
          ? 'Low — estimate or API fallback (see commute subscore notes)'
          : 'High — network-routed journey time used',
    });
  }
  if (m.commuteRankTier === 1) {
    rows.push({
      label: 'Commute route confirmation',
      value:
        'No confirmed TfL/OpenRouteService journey — ranked in the “estimate only” group and extra commute discount applied.',
    });
  }
  if (typeof m.commuteRoutingApiFailureExtraPenaltyApplied === 'number') {
    rows.push({
      label: 'Routing API failure penalty (commute subscore)',
      value: String(m.commuteRoutingApiFailureExtraPenaltyApplied),
    });
  }
  if (typeof m.commuteMaxMinutes === 'number') {
    rows.push({
      label: 'Commute time budget (search)',
      value: `${String(m.commuteMaxMinutes)} min`,
    });
  }
  if (typeof m.commuteTflPlannerSummary === 'string' && m.commuteTflPlannerSummary.trim() !== '') {
    rows.push({
      label: 'Transit planner slot',
      value: m.commuteTflPlannerSummary.trim(),
    });
  }
  if (typeof m.commuteTflRouteSummary === 'string' && m.commuteTflRouteSummary.trim() !== '') {
    rows.push({
      label: 'TfL route (first qualifying option)',
      value: m.commuteTflRouteSummary.trim(),
    });
  }
  if (typeof m.commuteTflRawJourneyCount === 'number') {
    rows.push({
      label: 'TfL routes (found before your filters)',
      value: String(m.commuteTflRawJourneyCount),
    });
  }
  if (typeof m.commuteTflQualifyingJourneyCount === 'number') {
    rows.push({
      label: 'TfL routes (after your filters)',
      value: String(m.commuteTflQualifyingJourneyCount),
    });
  }
  const tflHttpStatusForDetails = parseCommuteTflHttpStatusFromMetadata(m);
  if (tflHttpStatusForDetails !== undefined) {
    rows.push({
      label: 'TfL last HTTP status (if error path)',
      value: String(tflHttpStatusForDetails),
    });
  }
  const tflErrBody = m.commuteTflHttpErrorBody;
  if (typeof tflErrBody === 'string' && tflErrBody.trim() !== '') {
    rows.push({
      label: 'TfL API error detail',
      value: tflErrBody.trim(),
    });
  }
  if (m.commuteTflDurationMethod === 'median-first-three-qualifying') {
    rows.push({
      label: 'Transit duration',
      value: 'Median of up to the first three qualifying TfL journey options.',
    });
  }
  if (typeof m.commuteJourneyMinutes === 'number') {
    const model = typeof m.commuteModel === 'string' ? m.commuteModel : '';
    const journeyLabel =
      model === 'openrouteservice-directions' || model === 'openrouteservice-fallback-straight-line'
        ? 'Journey time (OpenRouteService)'
        : model === 'tfl-unified-api' || model === 'tfl-fallback-straight-line'
          ? 'Journey time (TfL)'
          : 'Estimated journey time';
    rows.push({
      label: journeyLabel,
      value: formatCommuteJourneyDurationForDisplay(m.commuteJourneyMinutes),
    });
  }
  if (typeof m.commuteAlternativeJourneyMinutes === 'number') {
    rows.push({
      label: 'Second acceptable route (approx.)',
      value: formatCommuteJourneyDurationForDisplay(m.commuteAlternativeJourneyMinutes),
    });
  }
  if (typeof m.commuteTflDisruptionHint === 'string' && m.commuteTflDisruptionHint.trim() !== '') {
    rows.push({
      label: 'TfL disruption',
      value: m.commuteTflDisruptionHint.trim(),
    });
  }
  if (m.commuteTflNationalSearchUsed === 1) {
    rows.push({
      label: 'TfL national search',
      value: 'This journey used a wider geographic search.',
    });
  }
  if (
    typeof m.commuteReliabilityFactor === 'number' &&
    Number.isFinite(m.commuteReliabilityFactor) &&
    m.commuteReliabilityFactor < 1
  ) {
    rows.push({
      label: 'Commute reliability scale',
      value: `Commute subscore (bar above) already includes ×${m.commuteReliabilityFactor.toFixed(3)} for disruption or route volatility.`,
    });
  }
  if (
    typeof m.commuteNetworkRoutingBonusApplied === 'number' &&
    m.commuteNetworkRoutingBonusApplied > 0
  ) {
    rows.push({
      label: 'Network routing bonus',
      value: `+${String(m.commuteNetworkRoutingBonusApplied)} points vs straight-line time proxy.`,
    });
  }
  if (
    typeof m.commuteStraightLineProxyPenaltyApplied === 'number' &&
    m.commuteStraightLineProxyPenaltyApplied > 0
  ) {
    rows.push({
      label: 'Straight-line time proxy',
      value: `Score reduced by ${String(m.commuteStraightLineProxyPenaltyApplied)} points (no routed journey duration).`,
    });
  }
  if (typeof m.futureTransportModel === 'string' && m.futureTransportModel.trim() !== '') {
    rows.push({ label: 'Planned transport (spike) model', value: m.futureTransportModel });
  }
  if (typeof m.futureTransportNearestScheme === 'string') {
    rows.push({
      label: 'Nearest illustrative scheme',
      value: m.futureTransportNearestScheme,
    });
  }
  if (typeof m.futureTransportNearestPointLabel === 'string') {
    rows.push({
      label: 'Nearest waypoint label',
      value: m.futureTransportNearestPointLabel,
    });
  }
  if (
    typeof m.futureTransportNearestKm === 'number' &&
    Number.isFinite(m.futureTransportNearestKm)
  ) {
    rows.push({
      label: 'Distance to nearest waypoint',
      value: `${m.futureTransportNearestKm.toFixed(2)} km (straight-line)`,
    });
  }
  if (
    typeof m.futureTransportProximityScore === 'number' &&
    Number.isFinite(m.futureTransportProximityScore)
  ) {
    rows.push({
      label: 'Proximity score (display only)',
      value: `${String(m.futureTransportProximityScore)} / 100`,
    });
  }
  if (typeof m.futureTransportSourceUrl === 'string' && m.futureTransportSourceUrl.trim() !== '') {
    rows.push({ label: 'Scheme source URL', value: m.futureTransportSourceUrl });
  }
  if (
    typeof m.futureTransportDataLastReviewed === 'string' &&
    m.futureTransportDataLastReviewed.trim() !== ''
  ) {
    rows.push({
      label: 'Waypoint list last checked',
      value: formatIsoDateUtcUkLong(m.futureTransportDataLastReviewed),
    });
  }
  if (isSizeFitSecondScoreActive(m)) {
    rows.push({ label: 'Floor-area fit model', value: String(m.sizeFitModel) });
    if (
      typeof m.sizeFitTypicalM2Coverage === 'string' &&
      m.sizeFitTypicalM2Coverage.trim() !== ''
    ) {
      rows.push({
        label: 'Typical m² coverage (this borough)',
        value: m.sizeFitTypicalM2Coverage.trim(),
      });
    }
    if (typeof m.sizeFitEpcGeneratedAt === 'string' && m.sizeFitEpcGeneratedAt.trim() !== '') {
      const isoDay = m.sizeFitEpcGeneratedAt.trim().slice(0, 10);
      rows.push({
        label: 'EPC median bundle generated',
        value: formatIsoDateUtcUkLong(isoDay),
      });
    }
    rows.push({ label: 'How to read this', value: SIZE_FIT_SCORE_DETAILS_READING });
    if (typeof m.sizeFitUserMinM2 === 'number' && Number.isFinite(m.sizeFitUserMinM2)) {
      rows.push({
        label: 'Your minimum floor area (m²)',
        value: m.sizeFitUserMinM2.toFixed(2),
      });
    }
    if (
      typeof m.sizeFitRawHeadroomRatio === 'number' &&
      Number.isFinite(m.sizeFitRawHeadroomRatio)
    ) {
      rows.push({
        label: 'Typical vs your minimum (ratio)',
        value: m.sizeFitRawHeadroomRatio.toFixed(3),
      });
    }
  }
  if (rows.length === 0) {
    return null;
  }
  return (
    <Box as="details" fontSize="sm" borderTopWidth="1px" borderColor="border.muted" pt={3}>
      <Box as="summary" cursor="pointer" color="fg.muted" _hover={{ color: 'fg' }}>
        Score details
      </Box>
      <Stack as="dl" gap={2} mt={3} pl={1}>
        {rows.map((r) => (
          <Box key={r.label}>
            <Text as="dt" fontWeight="medium" color="fg.muted">
              {r.label}
            </Text>
            <Text as="dd" ml={0} fontFamily="mono" fontSize="xs">
              {r.value}
            </Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export const AreaResultCard = ({
  area,
  isSelected = false,
  onSelectArea,
  onHideFromList,
  compare,
}: AreaResultCardProps) => {
  const meta = area.metadata;
  const tflHttpStatusParsed = parseCommuteTflHttpStatusFromMetadata(meta);
  const tflErrBodyForAlert =
    meta !== undefined &&
    typeof meta.commuteTflHttpErrorBody === 'string' &&
    meta.commuteTflHttpErrorBody.trim() !== ''
      ? meta.commuteTflHttpErrorBody.trim()
      : undefined;
  const interactive = onSelectArea !== undefined;
  const schoolsLine = schoolsDimensionExplanationLine(meta);
  const commuteLine = commuteDimensionExplanationLine(meta);
  const priceTrendLine = priceTrendDimensionExplanationLine(meta);
  const priceTrendBarLabel =
    meta?.priceTrendAppliedToComposite === 0
      ? 'Price momentum (not in headline total — data unavailable or no spread)'
      : 'Price momentum (UK HPI YoY, relative)';
  const noConfirmedRoute = commuteRankTierFromArea(area) === 1;

  return (
    <Card.Root
      variant="outline"
      tabIndex={interactive ? 0 : undefined}
      cursor={interactive ? 'pointer' : undefined}
      onClick={
        interactive
          ? () => {
              onSelectArea(area.id);
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectArea(area.id);
              }
            }
          : undefined
      }
      ring={isSelected ? 2 : 0}
      ringColor="blue.500"
      ringOffset="2px"
      transition="box-shadow 0.15s ease"
    >
      <Card.Body>
        <Stack gap={4}>
          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={2}>
            <Heading as="h3" size="md">
              {area.displayName}
            </Heading>
            <HStack gap={2} flexWrap="wrap" justify="flex-end">
              {noConfirmedRoute ? (
                <Badge colorPalette="orange" size="sm" variant="subtle">
                  Estimate only
                </Badge>
              ) : null}
              <Badge colorPalette="blue" size="lg">
                Score {String(area.score)}
              </Badge>
            </HStack>
          </HStack>
          <HStack gap={2} flexWrap="wrap" alignSelf="flex-start">
            {compare !== undefined ? (
              <Button
                size="xs"
                variant={compare.isInCompare ? 'solid' : 'outline'}
                colorPalette="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  compare.onToggle();
                }}
                disabled={compare.limitReached && !compare.isInCompare}
                title={
                  compare.limitReached && !compare.isInCompare
                    ? 'Remove an area from compare first (maximum 3).'
                    : undefined
                }
                aria-label={
                  compare.limitReached && !compare.isInCompare
                    ? 'Compare is full, remove an area first'
                    : compare.isInCompare
                      ? 'Remove from compare'
                      : 'Add to compare'
                }
              >
                {compare.isInCompare ? 'In compare' : 'Compare'}
              </Button>
            ) : null}
            {onHideFromList !== undefined ? (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  onHideFromList();
                }}
                aria-label={`Hide ${area.displayName} from this list`}
              >
                Hide
              </Button>
            ) : null}
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            {areaProvenanceDescription(area.metadata)} Lat {area.centroidLatitude.toFixed(3)}, Lng{' '}
            {area.centroidLongitude.toFixed(3)}
          </Text>
          <Stack gap={3}>
            <ScoreBar label="Affordability" value={area.breakdown.affordability} />
            <Stack gap={1}>
              <ScoreBar label="Commute" value={area.breakdown.commute} />
              {commuteLine !== null ? (
                <Text fontSize="xs" color="fg.muted" lineHeight="short">
                  {commuteLine}
                </Text>
              ) : null}
              {typeof meta?.commuteTflRouteSummary === 'string' &&
              meta.commuteTflRouteSummary.trim() !== '' ? (
                <Text fontSize="xs" color="fg.muted" lineHeight="short">
                  Route (first qualifying TfL option): {meta.commuteTflRouteSummary.trim()}
                </Text>
              ) : null}
            </Stack>
            {meta?.commuteModel === 'tfl-fallback-straight-line' ? (
              <Alert.Root status="warning" variant="subtle" size="sm">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title fontSize="sm">TfL journey not available</Alert.Title>
                  <Alert.Description fontSize="xs">
                    {typeof meta.commuteTflFailureCode === 'string'
                      ? meta.commuteTflFailureCode === 'http_error' &&
                        tflHttpStatusParsed !== undefined
                        ? `${describeTflHttpFailureAdvice(tflHttpStatusParsed, tflErrBodyForAlert)} Commute time uses a straight-line estimate instead.${tflErrBodyForAlert !== undefined ? ` TfL response: ${tflErrBodyForAlert}` : ''}`
                        : meta.commuteTflFailureCode === 'timeout'
                          ? 'TfL timed out; commute time uses a straight-line estimate instead.'
                          : `TfL could not return a usable journey (${meta.commuteTflFailureCode}). Commute time uses a straight-line estimate instead.`
                      : 'TfL did not return a usable journey; commute time uses a straight-line estimate instead.'}
                    {typeof meta.commuteTflPlannerSummary === 'string' &&
                    meta.commuteTflPlannerSummary.trim() !== ''
                      ? ` ${meta.commuteTflPlannerSummary.trim()}`
                      : ''}
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}
            <Stack gap={1}>
              <ScoreBar label="Schools" value={area.breakdown.schools} />
              {schoolsLine !== null ? (
                <Text fontSize="xs" color="fg.muted" lineHeight="short">
                  {schoolsLine}
                </Text>
              ) : null}
            </Stack>
            {meta?.policeUk === 'error' ? (
              <Alert.Root status="warning" variant="subtle" size="sm">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title fontSize="sm">Crime data unavailable</Alert.Title>
                  <Alert.Description fontSize="xs">
                    data.police.uk did not return usable data for this point (error, timeout, or
                    rate limit). The score shown is a conservative placeholder so the headline total
                    is not treated as if crime were average — prefer areas where crime loaded
                    successfully when comparing.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}
            {meta?.policeUk === 'partial' ? (
              <Alert.Root status="info" variant="subtle" size="sm">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title fontSize="sm">Crime data partial</Alert.Title>
                  <Alert.Description fontSize="xs">
                    One or more monthly police.uk requests failed (e.g. overload or timeout). The
                    crime score uses the months that loaded successfully — it is a real estimate,
                    not the full-window fallback.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}
            <Stack gap={1}>
              <ScoreBar label="Crime (higher is better)" value={area.breakdown.crime} />
              {area.breakdown.crime === 0 &&
              meta?.policeUk !== 'error' &&
              meta?.policeUk !== undefined ? (
                <Text fontSize="xs" color="fg.muted" lineHeight="short">
                  0 means the weakest relative score in this search (not missing data).
                </Text>
              ) : null}
            </Stack>
            <Stack gap={1}>
              <ScoreBar label={priceTrendBarLabel} value={area.breakdown.priceTrend} />
              <Text fontSize="xs" color="fg.muted" lineHeight="short">
                {priceTrendLine ?? 'Relative momentum among candidates; not a forecast.'}
              </Text>
            </Stack>
            {isSizeFitSecondScoreActive(meta) ? (
              <Stack gap={1}>
                <ScoreBar
                  label="Floor-area fit (second score, not in total)"
                  value={area.breakdown.sizeFit}
                />
                <Text fontSize="xs" color="fg.muted" lineHeight="short">
                  {sizeFitResultCardExplainer(
                    typeof meta?.sizeFitUserMinM2 === 'number' ? meta.sizeFitUserMinM2 : undefined,
                    meta,
                  )}
                  {meta?.sizeFitHasSpread === 0
                    ? ' Same headroom ratio for every candidate — subscores use the absolute headroom curve (not spread-based ranking within this batch).'
                    : ''}
                </Text>
              </Stack>
            ) : null}
            {typeof area.metadata?.futureTransportProximityScore === 'number' &&
            Number.isFinite(area.metadata.futureTransportProximityScore) ? (
              <Stack gap={1}>
                <ScoreBar
                  label="Planned transport proximity (spike; not in total score)"
                  value={area.metadata.futureTransportProximityScore}
                />
                <Text fontSize="xs" color="fg.muted" lineHeight="short">
                  Nearest illustrative waypoint:{' '}
                  {typeof area.metadata.futureTransportNearestPointLabel === 'string'
                    ? area.metadata.futureTransportNearestPointLabel
                    : '—'}
                  {' · '}
                  {typeof area.metadata.futureTransportNearestScheme === 'string'
                    ? area.metadata.futureTransportNearestScheme
                    : '—'}
                  {typeof area.metadata.futureTransportNearestKm === 'number' &&
                  Number.isFinite(area.metadata.futureTransportNearestKm)
                    ? ` (~${area.metadata.futureTransportNearestKm.toFixed(1)} km straight-line).`
                    : '.'}{' '}
                  {typeof area.metadata.futureTransportSourceUrl === 'string' ? (
                    <>
                      {' '}
                      <a
                        href={area.metadata.futureTransportSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--chakra-colors-blue-600, #2563eb)',
                          textDecoration: 'underline',
                        }}
                      >
                        Scheme source
                      </a>
                    </>
                  ) : null}
                </Text>
                {typeof area.metadata.futureTransportDataLastReviewed === 'string' &&
                area.metadata.futureTransportDataLastReviewed.trim() !== '' ? (
                  <Text fontSize="xs" color="fg.muted" lineHeight="short">
                    Waypoint list last checked:{' '}
                    {formatIsoDateUtcUkLong(area.metadata.futureTransportDataLastReviewed)}. Not
                    part of the headline score.
                  </Text>
                ) : null}
              </Stack>
            ) : null}
          </Stack>
          <ResultScoreDetails area={area} />
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};
