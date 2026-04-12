import { Alert, Box, Heading, HStack, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';
import { lazy, Suspense, type RefObject } from 'react';

import { AreaComparePanel } from './AreaComparePanel';
import { AreaResultCard } from './AreaResultCard';
import { CommuteAboutDataPanel } from './CommuteAboutDataPanel';
import { MethodologyPanel } from './MethodologyPanel';
import type { AreaSelectionSource, ResultsMapProps } from './ResultsMap';
import {
  commuteRankTierFromArea,
  partitionAreasByCommuteRouteConfirmation,
} from './commuteRouteConfirmation';
import {
  anyPoliceUkCrimeFetchFailed,
  anyPoliceUkCrimeFetchPartial,
  resultsUseStraightLineCommute,
} from './searchResultsAttribution';

const ResultsMapLazy = lazy(async () => {
  const m = await import('./ResultsMap');
  return { default: m.ResultsMap };
});

export interface AreaSearchResultsColumnProps {
  readonly resultsRegionRef: RefObject<HTMLDivElement | null>;
  readonly selectionLiveMessage: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly hasSearched: boolean;
  readonly areas: readonly RankedArea[];
  readonly compareAreas: readonly RankedArea[];
  readonly compareIds: readonly string[];
  readonly selectedAreaId: string | null;
  readonly workplace: ResultsMapProps['workplace'];
  readonly onSelectArea: (id: string | null, source?: AreaSelectionSource) => void;
  readonly setCardAnchorEl: (id: string, el: HTMLElement | null) => void;
  readonly onToggleCompare: (id: string) => void;
}

/**
 * Right column: ranked list (primary), map, compare, then trust content (commute about, warnings,
 * methodology). See docs/design/area-search-ux-polish-spec.md.
 */
export const AreaSearchResultsColumn = ({
  resultsRegionRef,
  selectionLiveMessage,
  loading,
  error,
  hasSearched,
  areas,
  compareAreas,
  compareIds,
  selectedAreaId,
  workplace,
  onSelectArea,
  setCardAnchorEl,
  onToggleCompare,
}: AreaSearchResultsColumnProps) => {
  const hasAreas = areas.length > 0;
  const showTrustStack = !loading && hasAreas;
  const { withConfirmedRoute, withoutConfirmedRoute } =
    partitionAreasByCommuteRouteConfirmation(areas);
  const hasRouteSplit =
    hasAreas && withConfirmedRoute.length > 0 && withoutConfirmedRoute.length > 0;

  return (
    <Stack
      gap={4}
      position="relative"
      ref={resultsRegionRef}
      id="area-search-results"
      tabIndex={-1}
    >
      <Box
        as="span"
        aria-live="polite"
        aria-atomic="true"
        position="absolute"
        w="1px"
        h="1px"
        p={0}
        m="-1px"
        overflow="hidden"
        whiteSpace="nowrap"
        borderWidth={0}
        style={{ clip: 'rect(0, 0, 0, 0)' }}
      >
        {selectionLiveMessage}
      </Box>
      <Heading as="h2" size="md">
        Results
      </Heading>
      {!loading && hasSearched && hasAreas ? (
        <Text fontSize="sm" color="fg.muted" role="status" aria-live="polite">
          Search complete: {areas.length} area{areas.length === 1 ? '' : 's'} ranked (best first
          {hasRouteSplit ? '; confirmed routes listed before estimate-only' : ''}). Top match:{' '}
          <Text as="span" fontWeight="medium" color="fg">
            {areas[0]?.displayName ?? ''}
          </Text>{' '}
          (score {String(areas[0]?.score ?? '')}
          {areas[0] !== undefined && commuteRankTierFromArea(areas[0]) === 1
            ? ', estimate-only commute'
            : ''}
          ).
        </Text>
      ) : null}
      {!loading && hasSearched && hasAreas && anyPoliceUkCrimeFetchFailed(areas) ? (
        <Alert.Root status="warning" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Some areas are missing crime data</Alert.Title>
            <Alert.Description fontSize="sm">
              data.police.uk did not return usable street-level crime for at least one candidate.
              Those areas show a warning on the card; their crime score is a conservative
              placeholder so the headline total is not inflated as if crime were average.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {!loading && hasSearched && hasAreas && anyPoliceUkCrimeFetchPartial(areas) ? (
        <Alert.Root status="info" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Some areas have partial crime data</Alert.Title>
            <Alert.Description fontSize="sm">
              data.police.uk returned data for only some months for at least one candidate. Those
              crime scores still reflect real incidents from the months that loaded; check each card
              for how many months were used.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {loading ? (
        <Box role="status" aria-live="polite" aria-busy="true">
          <HStack gap={2}>
            <Spinner size="sm" />
            <Text fontSize="sm" color="fg.muted">
              Ranking areas…
            </Text>
          </HStack>
        </Box>
      ) : null}
      {error ? (
        <Alert.Root status="error" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Search error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {!loading && !error && hasSearched && !hasAreas ? (
        <Alert.Root status="info" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>No areas in this run</Alert.Title>
            <Alert.Description fontSize="sm">
              The API returned an empty list. Try widening max commute minutes, increasing budget,
              or checking workplace coordinates — then search again.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {!loading && !hasSearched ? (
        <Stack gap={2}>
          <Text color="fg.muted" fontSize="sm">
            Set your criteria on the left, then use{' '}
            <Text as="span" fontWeight="semibold">
              Search areas
            </Text>{' '}
            to rank locations. Results appear here with a map when the API returns data.
          </Text>
          <Box as="details" fontSize="xs" color="fg.muted">
            <Box as="summary" cursor="pointer" fontWeight="medium">
              Local development (API + Vite)
            </Box>
            <Text mt={2}>
              Use{' '}
              <Text as="span" fontWeight="medium">
                npm run dev:stack
              </Text>{' '}
              or{' '}
              <Text as="span" fontWeight="medium">
                npm run sam:local
              </Text>{' '}
              (port 3000 after{' '}
              <Text as="span" fontWeight="medium">
                npm run sam:build
              </Text>
              ) with{' '}
              <Text as="span" fontWeight="medium">
                npm run dev
              </Text>{' '}
              so{' '}
              <Text as="span" fontFamily="mono">
                /api/search-areas
              </Text>{' '}
              proxies — see docs/infrastructure/aws-sam.md.
            </Text>
          </Box>
        </Stack>
      ) : null}
      {hasAreas ? (
        <Stack gap={6}>
          {withConfirmedRoute.length > 0 ? (
            <Stack gap={3}>
              {hasRouteSplit ? (
                <Heading as="h3" size="sm" fontWeight="semibold" color="fg.muted">
                  Confirmed route (TfL or OpenRouteService)
                </Heading>
              ) : null}
              <SimpleGrid columns={1} gap={4}>
                {withConfirmedRoute.map((a) => (
                  <Box
                    key={a.id}
                    ref={(el: HTMLElement | null) => {
                      setCardAnchorEl(a.id, el);
                    }}
                  >
                    <AreaResultCard
                      area={a}
                      isSelected={selectedAreaId === a.id}
                      onSelectArea={(id) => {
                        onSelectArea(id, 'list');
                      }}
                      compare={{
                        isInCompare: compareIds.includes(a.id),
                        onToggle: () => {
                          onToggleCompare(a.id);
                        },
                        limitReached: compareIds.length >= 3 && !compareIds.includes(a.id),
                      }}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
          ) : null}
          {withoutConfirmedRoute.length > 0 ? (
            <Stack gap={3}>
              {hasRouteSplit || withoutConfirmedRoute.length === areas.length ? (
                <Stack gap={1}>
                  <Heading as="h3" size="sm" fontWeight="semibold" color="fg.muted">
                    No confirmed route (estimate only)
                  </Heading>
                  <Text fontSize="xs" color="fg.muted">
                    TfL or OpenRouteService did not return a usable journey for these areas; commute
                    time is a straight-line estimate and the commute subscore includes an extra
                    discount.
                    {hasRouteSplit ? ' They are sorted after areas with a confirmed route.' : ''}
                  </Text>
                </Stack>
              ) : null}
              <SimpleGrid columns={1} gap={4}>
                {withoutConfirmedRoute.map((a) => (
                  <Box
                    key={a.id}
                    ref={(el: HTMLElement | null) => {
                      setCardAnchorEl(a.id, el);
                    }}
                  >
                    <AreaResultCard
                      area={a}
                      isSelected={selectedAreaId === a.id}
                      onSelectArea={(id) => {
                        onSelectArea(id, 'list');
                      }}
                      compare={{
                        isInCompare: compareIds.includes(a.id),
                        onToggle: () => {
                          onToggleCompare(a.id);
                        },
                        limitReached: compareIds.length >= 3 && !compareIds.includes(a.id),
                      }}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
          ) : null}
        </Stack>
      ) : null}
      {showTrustStack ? (
        <Suspense
          fallback={
            <Text fontSize="sm" color="fg.muted">
              Loading map…
            </Text>
          }
        >
          <ResultsMapLazy
            workplace={workplace}
            areas={areas}
            selectedAreaId={selectedAreaId}
            onSelectArea={onSelectArea}
          />
        </Suspense>
      ) : null}
      {showTrustStack && compareAreas.length >= 2 ? (
        <AreaComparePanel areas={compareAreas} />
      ) : null}
      {showTrustStack ? <CommuteAboutDataPanel /> : null}
      {showTrustStack && resultsUseStraightLineCommute(areas) ? (
        <Alert.Root status="warning" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Commute times are approximate</Alert.Title>
            <Alert.Description fontSize="sm">
              At least one area used a straight-line estimate or a routing fallback — not a full
              network journey. Put{' '}
              <Text as="span" fontFamily="mono">
                TFL_APP_KEY
              </Text>{' '}
              and{' '}
              <Text as="span" fontFamily="mono">
                ORS_API_KEY
              </Text>{' '}
              under{' '}
              <Text as="span" fontFamily="mono">
                SearchAreasFunction
              </Text>{' '}
              in{' '}
              <Text as="span" fontFamily="mono">
                sam/env.json
              </Text>{' '}
              (or{' '}
              <Text as="span" fontFamily="mono">
                sam/env.local.json
              </Text>
              ) and run{' '}
              <Text as="span" fontWeight="medium">
                npm run dev:stack
              </Text>{' '}
              (or{' '}
              <Text as="span" fontWeight="medium">
                npm run sam:local
              </Text>{' '}
              with Vite). Root{' '}
              <Text as="span" fontFamily="mono">
                .env
              </Text>{' '}
              is for{' '}
              <Text as="span" fontFamily="mono">
                VITE_*
              </Text>{' '}
              only — it does not supply Lambda keys. In production, configure the same on
              SearchAreasFunction. Enable strict routing so misconfiguration surfaces as an error
              instead of silent fallback.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {showTrustStack ? <MethodologyPanel areas={areas} /> : null}
      {!loading && !hasAreas ? <CommuteAboutDataPanel /> : null}
    </Stack>
  );
};
