import { Badge, Box, Card, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import type { RankedAreaDto } from '@shared/searchAreasContract';

import { areaProvenanceDescription, hasCrimeMetadataDetails } from './searchResultsAttribution';
import { ScoreBar } from './ScoreBar';

export interface AreaResultCardProps {
  readonly area: RankedAreaDto;
}

const ResultScoreDetails = ({ area }: { area: RankedAreaDto }) => {
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
      rows.push({ label: 'Months used in score', value: String(m.crimeMonthsUsed) });
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

export const AreaResultCard = ({ area }: AreaResultCardProps) => (
  <Card.Root variant="outline">
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
        <Text fontSize="sm" color="fg.muted">
          {areaProvenanceDescription(area.metadata)} Lat {area.centroidLatitude.toFixed(3)}, Lng{' '}
          {area.centroidLongitude.toFixed(3)}
        </Text>
        <Stack gap={3}>
          <ScoreBar label="Affordability" value={area.breakdown.affordability} />
          <ScoreBar label="Commute" value={area.breakdown.commute} />
          <ScoreBar label="Schools" value={area.breakdown.schools} />
          <ScoreBar label="Crime (higher is better)" value={area.breakdown.crime} />
        </Stack>
        <ResultScoreDetails area={area} />
      </Stack>
    </Card.Body>
  </Card.Root>
);
