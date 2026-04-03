import { Badge, Box, Button, Card, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';

import { formatIsoDateUtcUkLong } from '@shared/futureTransport/formatIsoDateUtcUkLong';
import { schoolsDimensionExplanationLine } from '@shared/schools/schoolsDimensionExplanation';

import { commuteModelDisplayLabel } from './commuteModelLabels';
import { areaProvenanceDescription, hasCrimeMetadataDetails } from './searchResultsAttribution';
import { ScoreBar } from './ScoreBar';

export interface AreaResultCardProps {
  readonly area: RankedArea;
  readonly isSelected?: boolean;
  readonly onSelectArea?: (id: string) => void;
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
      const suffix =
        cap !== undefined && requested !== undefined && requested > cap
          ? ` (max ${String(cap)} per search)`
          : '';
      rows.push({
        label: 'Months used in score',
        value: `${String(m.crimeMonthsUsed)}${suffix}`,
      });
    }
    if (typeof m.crimeWeightedTotal === 'number') {
      rows.push({
        label: 'Weighted incidents (sum over months)',
        value: String(m.crimeWeightedTotal),
      });
    }
    if (m.policeUk === 'ok' || m.policeUk === 'error') {
      rows.push({ label: 'Police.uk fetch', value: m.policeUk });
    }
  }
  if (typeof m.commuteModel === 'string') {
    rows.push({
      label: 'Commute model',
      value: commuteModelDisplayLabel(m.commuteModel),
    });
  }
  if (typeof m.commuteTflPlannerSummary === 'string' && m.commuteTflPlannerSummary.trim() !== '') {
    rows.push({
      label: 'Transit planner slot',
      value: m.commuteTflPlannerSummary.trim(),
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
      value: `${String(m.commuteJourneyMinutes)} min`,
    });
  }
  if (typeof m.commuteAlternativeJourneyMinutes === 'number') {
    rows.push({
      label: 'Second acceptable route (approx.)',
      value: `${String(m.commuteAlternativeJourneyMinutes)} min`,
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
      value: `Score multiplied by ${m.commuteReliabilityFactor.toFixed(3)} (disruption or route volatility).`,
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
  compare,
}: AreaResultCardProps) => {
  const interactive = onSelectArea !== undefined;
  const schoolsLine = schoolsDimensionExplanationLine(area.metadata);

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
            <Badge colorPalette="blue" size="lg">
              Score {String(area.score)}
            </Badge>
          </HStack>
          {compare !== undefined ? (
            <Button
              size="xs"
              variant={compare.isInCompare ? 'solid' : 'outline'}
              colorPalette="gray"
              alignSelf="flex-start"
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
          <Text fontSize="sm" color="fg.muted">
            {areaProvenanceDescription(area.metadata)} Lat {area.centroidLatitude.toFixed(3)}, Lng{' '}
            {area.centroidLongitude.toFixed(3)}
          </Text>
          <Stack gap={3}>
            <ScoreBar label="Affordability" value={area.breakdown.affordability} />
            <ScoreBar label="Commute" value={area.breakdown.commute} />
            <Stack gap={1}>
              <ScoreBar label="Schools" value={area.breakdown.schools} />
              {schoolsLine !== null ? (
                <Text fontSize="xs" color="fg.muted" lineHeight="short">
                  {schoolsLine}
                </Text>
              ) : null}
            </Stack>
            <ScoreBar label="Crime (higher is better)" value={area.breakdown.crime} />
            <Stack gap={1}>
              <ScoreBar
                label="Price momentum (UK HPI YoY, relative)"
                value={area.breakdown.priceTrend}
              />
              <Text fontSize="xs" color="fg.muted" lineHeight="short">
                {typeof area.metadata?.priceTrendYoyPct === 'number' &&
                Number.isFinite(area.metadata.priceTrendYoyPct)
                  ? `Borough year-on-year ≈ ${area.metadata.priceTrendYoyPct.toFixed(1)}% (discovery only).`
                  : area.metadata?.priceTrendModel === 'unavailable'
                    ? 'Enable live UK HPI on the search API for YoY momentum.'
                    : 'Relative rank among candidates in this search; not a forecast.'}
              </Text>
            </Stack>
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
