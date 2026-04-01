import { Badge, Box, Button, Card, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';

import { schoolsDimensionExplanationLine } from '@shared/schools/schoolsDimensionExplanation';

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
    rows.push({ label: 'Affordability (borough median ref)', value: m.affordabilityBorough });
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
    rows.push({ label: 'Commute model', value: m.commuteModel });
  }
  if (typeof m.commuteJourneyMinutes === 'number') {
    rows.push({
      label: 'Journey time (TfL)',
      value: `${String(m.commuteJourneyMinutes)} min`,
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
          </Stack>
          <ResultScoreDetails area={area} />
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};
