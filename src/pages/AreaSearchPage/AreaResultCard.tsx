import { Badge, Box, Card, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import type { RankedAreaDto } from '@shared/searchAreasContract';

import { ScoreBar } from './ScoreBar';

export interface AreaResultCardProps {
  readonly area: RankedAreaDto;
}

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
          Composite is a stub until real signals are wired. Lat {area.centroidLatitude.toFixed(3)},
          Lng {area.centroidLongitude.toFixed(3)}
        </Text>
        <Stack gap={3}>
          <ScoreBar label="Affordability" value={area.breakdown.affordability} />
          <ScoreBar label="Commute" value={area.breakdown.commute} />
          <ScoreBar label="Schools" value={area.breakdown.schools} />
          <ScoreBar label="Crime (higher is better)" value={area.breakdown.crime} />
        </Stack>
        {area.metadata && Object.keys(area.metadata).length > 0 ? (
          <Box fontSize="xs" color="fg.muted" fontFamily="mono">
            {JSON.stringify(area.metadata)}
          </Box>
        ) : null}
      </Stack>
    </Card.Body>
  </Card.Root>
);
