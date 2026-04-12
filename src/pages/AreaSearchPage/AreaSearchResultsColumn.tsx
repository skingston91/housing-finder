import {
  Alert,
  Box,
  Button,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';
import { lazy, Suspense, useMemo, useState, type RefObject } from 'react';

import { AreaComparePanel } from './AreaComparePanel';
import { AreaResultCard } from './AreaResultCard';
import { CommuteAboutDataPanel } from './CommuteAboutDataPanel';
import { MethodologyPanel } from './MethodologyPanel';
import { SearchDataQualityPanel, type SearchDataQualitySummary } from './SearchDataQualityPanel';
import type { AreaSelectionSource, ResultsMapProps } from './ResultsMap';
import { commuteRankTierFromArea } from './commuteRouteConfirmation';
import {
  anyPoliceUkCrimeFetchFailed,
  anyPoliceUkCrimeFetchPartial,
  manyTransitAreasHitTflFallback,
  resultsUseStraightLineCommute,
} from './searchResultsAttribution';
import type { AreaSortKey, SortDirection } from './sortRankedAreas';
import { sortPartitionedByRouteConfirmation, sortRankedAreas } from './sortRankedAreas';

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
  /** When true and the API did not blend momentum into the composite, the results banner explains why. */
  readonly includePriceTrendInComposite: boolean;
  /** Candidates dropped because commute used straight-line fallback while others had routed journeys. */
  readonly commuteOmittedEstimateOnlyCount?: number;
  /** Full list of those candidates (for labels and scores — not mixed into the headline ordering). */
  readonly commuteOmittedEstimateOnlyAreas?: readonly RankedArea[];
  readonly dataQualitySummary: SearchDataQualitySummary | null;
  readonly areas: readonly RankedArea[];
  readonly hiddenAreaIds: readonly string[];
  readonly onHideArea: (id: string) => void;
  readonly onShowAllHiddenAreas: () => void;
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
  includePriceTrendInComposite,
  commuteOmittedEstimateOnlyCount,
  commuteOmittedEstimateOnlyAreas,
  dataQualitySummary,
  areas,
  hiddenAreaIds,
  onHideArea,
  onShowAllHiddenAreas,
  compareAreas,
  compareIds,
  selectedAreaId,
  workplace,
  onSelectArea,
  setCardAnchorEl,
  onToggleCompare,
}: AreaSearchResultsColumnProps) => {
  const [sortKey, setSortKey] = useState<AreaSortKey>('headline');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const hasAreas = areas.length > 0;
  const hiddenSet = useMemo(() => new Set(hiddenAreaIds), [hiddenAreaIds]);
  const visibleAreas = useMemo(() => areas.filter((a) => !hiddenSet.has(a.id)), [areas, hiddenSet]);
  const hasVisibleAreas = visibleAreas.length > 0;
  const hiddenCount = hiddenAreaIds.length;

  const { withConfirmedRoute, withoutConfirmedRoute } = useMemo(
    () => sortPartitionedByRouteConfirmation(visibleAreas, sortKey, sortDirection),
    [visibleAreas, sortKey, sortDirection],
  );

  const fullCandidateListSorted = useMemo(() => {
    const omitted = commuteOmittedEstimateOnlyAreas ?? [];
    const byId = new Map<string, RankedArea>();
    for (const a of areas) {
      byId.set(a.id, a);
    }
    for (const a of omitted) {
      if (!byId.has(a.id)) {
        byId.set(a.id, a);
      }
    }
    return sortRankedAreas([...byId.values()], sortKey, sortDirection);
  }, [areas, commuteOmittedEstimateOnlyAreas, sortKey, sortDirection]);

  const topDisplayArea = withConfirmedRoute[0] ?? withoutConfirmedRoute[0];

  const showTrustStack = !loading && hasAreas;
  const hasRouteSplit =
    hasVisibleAreas && withConfirmedRoute.length > 0 && withoutConfirmedRoute.length > 0;

  const omittedForRoutingPolicy =
    commuteOmittedEstimateOnlyCount !== undefined && commuteOmittedEstimateOnlyCount > 0
      ? commuteOmittedEstimateOnlyCount
      : 0;
  const totalCandidateLocationsScored =
    omittedForRoutingPolicy > 0 ? areas.length + omittedForRoutingPolicy : areas.length;

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
        <Stack gap={3}>
          <HStack gap={3} flexWrap="wrap" align="flex-end">
            <Box minW={{ base: '100%', sm: '200px' }} flex={{ base: '1 1 100%', sm: '1 1 200px' }}>
              <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb={1}>
                Sort by
              </Text>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={sortKey}
                  onChange={(e) => {
                    setSortKey(e.currentTarget.value as AreaSortKey);
                  }}
                  aria-label="Sort areas by column"
                >
                  <option value="headline">Headline score</option>
                  <option value="affordability">Affordability</option>
                  <option value="commute">Commute</option>
                  <option value="schools">Schools</option>
                  <option value="crime">Crime</option>
                  <option value="priceTrend">Price momentum</option>
                  <option value="sizeFit">Size fit</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
            <Box minW={{ base: '100%', sm: '160px' }} flex={{ base: '1 1 100%', sm: '0 0 160px' }}>
              <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb={1}>
                Order
              </Text>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={sortDirection}
                  onChange={(e) => {
                    setSortDirection(e.currentTarget.value as SortDirection);
                  }}
                  aria-label="Sort direction"
                >
                  <option value="desc">High to low (best first)</option>
                  <option value="asc">Low to high (worst first)</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
          </HStack>
          <Text fontSize="sm" color="fg.muted" role="status" aria-live="polite">
            Search complete: {visibleAreas.length} area{visibleAreas.length === 1 ? '' : 's'} shown
            {hiddenCount > 0 ? <> ({String(hiddenCount)} hidden)</> : null} — sorted by{' '}
            {sortKey === 'headline' ? 'headline score' : sortKey}
            {sortDirection === 'desc' ? ', best first' : ', worst first'}
            {hasRouteSplit ? '; confirmed routes listed before estimate-only' : ''}.
            {omittedForRoutingPolicy > 0 ? (
              <>
                {' '}
                {totalCandidateLocationsScored} candidate locations were scored in total;{' '}
                {omittedForRoutingPolicy} had estimate-only commute and are excluded from this
                ranking (see alert below)—not because of low score.
              </>
            ) : null}{' '}
            {topDisplayArea !== undefined ? (
              <>
                Top in this view:{' '}
                <Text as="span" fontWeight="medium" color="fg">
                  {topDisplayArea.displayName}
                </Text>{' '}
                (score {String(topDisplayArea.score)}
                {commuteRankTierFromArea(topDisplayArea) === 1 ? ', estimate-only commute' : ''}).
              </>
            ) : null}
          </Text>
          {hiddenCount > 0 ? (
            <Button size="xs" variant="outline" onClick={onShowAllHiddenAreas}>
              Show hidden areas again ({String(hiddenCount)})
            </Button>
          ) : null}
        </Stack>
      ) : null}
      {!loading && hasSearched && hasAreas && dataQualitySummary !== null ? (
        <SearchDataQualityPanel summary={dataQualitySummary} />
      ) : null}
      {!loading &&
      hasSearched &&
      hasAreas &&
      commuteOmittedEstimateOnlyCount !== undefined &&
      commuteOmittedEstimateOnlyCount > 0 ? (
        <Alert.Root status="info" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Estimate-only commute rows excluded from this list</Alert.Title>
            <Alert.Description fontSize="sm">
              {commuteOmittedEstimateOnlyCount}{' '}
              {commuteOmittedEstimateOnlyCount === 1 ? 'area had' : 'areas had'} no confirmed
              network-routed journey (TfL or OpenRouteService) while others did, so{' '}
              {commuteOmittedEstimateOnlyCount === 1 ? 'it was' : 'they were'} omitted from the
              ranked list below. This is not “low score”—we avoid mixing real journey times with
              straight-line estimates when any candidate has a confirmed route. Rankings here use
              routed journey times only.
            </Alert.Description>
            {commuteOmittedEstimateOnlyAreas !== undefined &&
            commuteOmittedEstimateOnlyAreas.length > 0 ? (
              <Text as="p" fontSize="sm" fontWeight="semibold" color="fg" mt={3} lineHeight="short">
                <Text as="span" fontWeight="normal" color="fg.muted">
                  Omitted areas:{' '}
                </Text>
                {commuteOmittedEstimateOnlyAreas.map((a) => a.displayName).join(' · ')}
              </Text>
            ) : null}
            {commuteOmittedEstimateOnlyAreas !== undefined &&
            commuteOmittedEstimateOnlyAreas.length > 0 ? (
              <Box
                mt={3}
                borderWidth="1px"
                borderColor="gray.200"
                rounded="md"
                p={3}
                maxH="280px"
                overflowY="auto"
              >
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={2}>
                  Per-area scores (still computed; not in headline list)
                </Text>
                <Stack as="ul" gap={2} fontSize="sm" listStyleType="none" pl={0}>
                  {commuteOmittedEstimateOnlyAreas.map((a) => {
                    const model =
                      typeof a.metadata?.commuteModel === 'string' ? a.metadata.commuteModel : '—';
                    const mins =
                      typeof a.metadata?.commuteJourneyMinutes === 'number'
                        ? a.metadata.commuteJourneyMinutes
                        : undefined;
                    return (
                      <Box
                        as="li"
                        key={a.id}
                        borderBottomWidth="1px"
                        borderColor="gray.200"
                        pb={2}
                        _last={{ borderBottomWidth: 0, pb: 0 }}
                      >
                        <Text fontWeight="medium">{a.displayName}</Text>
                        <Text color="fg.muted" fontSize="xs">
                          Headline score {String(a.score)} · commute model {model}
                          {mins !== undefined ? ` · ${String(mins)} min (estimate)` : ''}
                        </Text>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ) : null}
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {!loading &&
      hasSearched &&
      hasAreas &&
      includePriceTrendInComposite &&
      areas[0]?.metadata?.priceTrendAppliedToComposite === 0 ? (
        <Alert.Root status="info" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Price momentum not included in the headline total</Alert.Title>
            <Alert.Description fontSize="sm">
              You asked to include price momentum, but it is not blended into the composite for this
              run: UK HPI data may be unavailable, or every candidate tied on the same YoY so there
              was nothing to rank. The momentum bar on each card still shows the neutral or relative
              score for context.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {!loading && hasSearched && hasAreas && manyTransitAreasHitTflFallback(areas) ? (
        <Alert.Root status="warning" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Many transit rows used TfL fallback</Alert.Title>
            <Alert.Description fontSize="sm">
              Transport for London did not return a usable journey for a large share of candidates
              (straight-line estimates with commute penalties). Your filters may be excluding every
              option—try relaxing avoided lines, the “two routes” requirement, or leg limits—or
              check TfL keys and rate limits. See each card for failure codes and route counts
              before vs after your filters.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {!loading && hasSearched && hasAreas && hasRouteSplit ? (
        <Alert.Root status="info" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Why some areas are “estimate only”</Alert.Title>
            <Alert.Description fontSize="sm">
              Some areas have no valid routes after applying your filters (avoided lines, minimum
              route count, and leg limits), so estimates are shown instead. Confirmed routes are
              listed first; estimate-only rows are sorted after them.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
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
      {!loading && hasSearched && hasAreas && !hasVisibleAreas ? (
        <Alert.Root status="info" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Every area is hidden from this view</Alert.Title>
            <Alert.Description fontSize="sm">
              Use{' '}
              <Text as="span" fontWeight="medium">
                Show hidden areas again
              </Text>{' '}
              above, or pick a new search — hidden rows stay out of the list and map until you
              restore them.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      {hasAreas && hasVisibleAreas ? (
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
                      onHideFromList={() => {
                        onHideArea(a.id);
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
              {hasRouteSplit || withoutConfirmedRoute.length === visibleAreas.length ? (
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
                      onHideFromList={() => {
                        onHideArea(a.id);
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
      {hasAreas && fullCandidateListSorted.length > 0 ? (
        <Box as="details" borderWidth="1px" borderColor="gray.200" rounded="md" p={3} bg="white">
          <Box as="summary" cursor="pointer" fontWeight="semibold" fontSize="sm">
            Full candidate list ({fullCandidateListSorted.length} rows) — includes areas not in the
            main ranking
          </Box>
          <Text fontSize="xs" color="fg.muted" mt={2} mb={3}>
            Same sort as above. Rows that were dropped from the headline list (for example
            estimate-only commute when others had routed journeys) appear with a note in the last
            column.
          </Text>
          <Box overflowX="auto">
            <Box as="table" width="100%" fontSize="xs" style={{ borderCollapse: 'collapse' }}>
              <Box as="thead">
                <Box as="tr" borderBottomWidth="1px" borderColor="gray.200">
                  {(
                    [
                      'Area',
                      'Headline',
                      'Aff.',
                      'Commute',
                      'Schools',
                      'Crime',
                      'Mom.',
                      'Fit',
                      'In main list',
                    ] as const
                  ).map((h) => (
                    <Box
                      key={h}
                      as="th"
                      textAlign="left"
                      py={2}
                      pr={2}
                      fontWeight="semibold"
                      color="fg.muted"
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {fullCandidateListSorted.map((a) => {
                  const inMain = areas.some((x) => x.id === a.id);
                  const b = a.breakdown;
                  return (
                    <Box
                      as="tr"
                      key={a.id}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _last={{ borderBottomWidth: 0 }}
                    >
                      <Box as="td" py={2} pr={2} whiteSpace="nowrap" fontWeight="medium">
                        {a.displayName}
                      </Box>
                      <Box as="td" py={2} pr={2} fontFamily="mono">
                        {String(a.score)}
                      </Box>
                      <Box as="td" py={2} pr={2} fontFamily="mono">
                        {String(b.affordability)}
                      </Box>
                      <Box as="td" py={2} pr={2} fontFamily="mono">
                        {String(b.commute)}
                      </Box>
                      <Box as="td" py={2} pr={2} fontFamily="mono">
                        {String(b.schools)}
                      </Box>
                      <Box as="td" py={2} pr={2} fontFamily="mono">
                        {String(b.crime)}
                      </Box>
                      <Box as="td" py={2} pr={2} fontFamily="mono">
                        {String(b.priceTrend)}
                      </Box>
                      <Box as="td" py={2} pr={2} fontFamily="mono">
                        {String(b.sizeFit)}
                      </Box>
                      <Box as="td" py={2} pr={2} color="fg.muted">
                        {inMain ? 'Yes' : 'No — omitted from headline list'}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}
      {showTrustStack && hasVisibleAreas ? (
        <Suspense
          fallback={
            <Text fontSize="sm" color="fg.muted">
              Loading map…
            </Text>
          }
        >
          <ResultsMapLazy
            workplace={workplace}
            areas={[...withConfirmedRoute, ...withoutConfirmedRoute]}
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
