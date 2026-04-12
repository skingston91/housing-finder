import { Box, Button, Container, Heading, HStack, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { httpAreaDiscoveryAdapter } from '@/adapters/httpAreaDiscovery';
import { httpWorkplaceGeocodeAdapter } from '@/adapters/httpWorkplaceGeocode';

import type { AreaSelectionSource } from './ResultsMap';
import { AreaSearchCriteriaForm } from './AreaSearchCriteriaForm';
import { AreaSearchResultsColumn } from './AreaSearchResultsColumn';
import { getInitialAreaSearchFormFromWindow } from './areaSearchUrlState';
import { buildAreaSearchCriteria, defaultFormState } from './buildSearchAreasRequest';
import { getSelectionAnnouncement } from './selectionAnnouncement';
import { useAreaSearchUrlSync } from './useAreaSearchUrlSync';

export const AreaSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(getInitialAreaSearchFormFromWindow);
  const [areas, setAreas] = useState<readonly RankedArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodePending, setGeocodePending] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocodeSuccessMessage, setGeocodeSuccessMessage] = useState<string | null>(null);
  const geocodeSuccessTimeoutRef = useRef<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [selectionLiveMessage, setSelectionLiveMessage] = useState('');
  const previousSelectionRef = useRef<string | null | undefined>(undefined);
  const cardAnchorRefs = useRef(new Map<string, HTMLElement>());
  const [hasSearched, setHasSearched] = useState(false);
  const [commuteOmittedEstimateOnlyCount, setCommuteOmittedEstimateOnlyCount] = useState<
    number | undefined
  >(undefined);
  const [copyLinkMessage, setCopyLinkMessage] = useState<string | null>(null);
  const copyLinkTimeoutRef = useRef<number | null>(null);
  const resultsRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (copyLinkTimeoutRef.current !== null) {
        window.clearTimeout(copyLinkTimeoutRef.current);
        copyLinkTimeoutRef.current = null;
      }
      if (geocodeSuccessTimeoutRef.current !== null) {
        window.clearTimeout(geocodeSuccessTimeoutRef.current);
        geocodeSuccessTimeoutRef.current = null;
      }
    };
  }, []);

  const { urlMessage, resetSearchUrlBar } = useAreaSearchUrlSync(
    form,
    setForm,
    searchParams,
    setSearchParams,
  );

  useEffect(() => {
    setCompareIds((prev) => prev.filter((id) => areas.some((a) => a.id === id)));
  }, [areas]);

  useEffect(() => {
    if (areas.length === 0) {
      previousSelectionRef.current = undefined;
      setSelectionLiveMessage('');
      return;
    }
    const msg = getSelectionAnnouncement(previousSelectionRef.current, selectedAreaId, areas);
    previousSelectionRef.current = selectedAreaId;
    if (msg !== null) {
      setSelectionLiveMessage(msg);
    }
  }, [selectedAreaId, areas]);

  const setCardAnchorEl = useCallback((id: string, el: HTMLElement | null) => {
    const m = cardAnchorRefs.current;
    if (el === null) {
      m.delete(id);
    } else {
      m.set(id, el);
    }
  }, []);

  const handleSelectArea = useCallback((id: string | null, source?: AreaSelectionSource) => {
    setSelectedAreaId(id);
    if (source === 'map' && id !== null) {
      requestAnimationFrame(() => {
        cardAnchorRefs.current.get(id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      });
    }
  }, []);

  const handleGeocodeFromLabel = useCallback(async () => {
    setGeocodeError(null);
    setGeocodeSuccessMessage(null);
    if (geocodeSuccessTimeoutRef.current !== null) {
      window.clearTimeout(geocodeSuccessTimeoutRef.current);
      geocodeSuccessTimeoutRef.current = null;
    }
    const q = form.workplaceLabel.trim();
    if (q.length < 2) {
      setGeocodeError('Enter a workplace name (at least 2 characters).');
      return;
    }
    setGeocodePending(true);
    try {
      const res = await httpWorkplaceGeocodeAdapter.geocodeFromLabel(q);
      setForm((prev) => ({
        ...prev,
        workplaceLabel: res.displayName,
        workplaceLat: res.latitude,
        workplaceLng: res.longitude,
      }));
      setGeocodeSuccessMessage(
        'Coordinates filled from your label. You can search or adjust them.',
      );
      geocodeSuccessTimeoutRef.current = window.setTimeout(() => {
        setGeocodeSuccessMessage(null);
        geocodeSuccessTimeoutRef.current = null;
      }, 5000);
    } catch (e) {
      setGeocodeError(e instanceof Error ? e.message : 'Geocode failed');
    } finally {
      setGeocodePending(false);
    }
  }, [form.workplaceLabel]);

  const compareAreas = useMemo(() => {
    const byId = new Map(areas.map((a) => [a.id, a]));
    return compareIds.map((id) => byId.get(id)).filter((a): a is RankedArea => a !== undefined);
  }, [areas, compareIds]);

  const handleCopyLink = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    void navigator.clipboard.writeText(window.location.href).then(
      () => {
        if (copyLinkTimeoutRef.current !== null) {
          window.clearTimeout(copyLinkTimeoutRef.current);
        }
        setCopyLinkMessage('Link copied to clipboard.');
        copyLinkTimeoutRef.current = window.setTimeout(() => {
          setCopyLinkMessage(null);
          copyLinkTimeoutRef.current = null;
        }, 2500);
      },
      () => {
        setCopyLinkMessage('Could not copy — check browser permissions.');
        copyLinkTimeoutRef.current = window.setTimeout(() => {
          setCopyLinkMessage(null);
          copyLinkTimeoutRef.current = null;
        }, 3500);
      },
    );
  }, []);

  const handleResetSearch = useCallback(() => {
    setForm(defaultFormState());
    setAreas([]);
    setCommuteOmittedEstimateOnlyCount(undefined);
    setError(null);
    setHasSearched(false);
    setGeocodeError(null);
    setGeocodeSuccessMessage(null);
    if (geocodeSuccessTimeoutRef.current !== null) {
      window.clearTimeout(geocodeSuccessTimeoutRef.current);
      geocodeSuccessTimeoutRef.current = null;
    }
    resetSearchUrlBar();
  }, [resetSearchUrlBar]);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const workplaceForMap = useMemo(() => {
    if (form.workplaceLat === '' || form.workplaceLng === '') {
      return null;
    }
    const label = form.workplaceLabel.trim();
    return {
      latitude: form.workplaceLat,
      longitude: form.workplaceLng,
      label: label.length > 0 ? label : 'Workplace',
    };
  }, [form.workplaceLat, form.workplaceLng, form.workplaceLabel]);

  const focusResultsRegion = useCallback(() => {
    requestAnimationFrame(() => {
      resultsRegionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      resultsRegionRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const handleSearch = useCallback(async () => {
    setError(null);
    handleSelectArea(null);
    const criteria = buildAreaSearchCriteria(form);
    if (!criteria) {
      setError(
        'Cannot search yet: set max price to at least £1, choose at least one property type, enter a workplace with latitude and longitude (use “Fill coordinates from label” if needed), and ensure school phases and crime weights are valid.',
      );
      return;
    }
    setLoading(true);
    try {
      const ranked = await httpAreaDiscoveryAdapter.findRankedAreas(criteria);
      setAreas(ranked.areas);
      setCommuteOmittedEstimateOnlyCount(ranked.commuteOmittedEstimateOnlyCount);
      setHasSearched(true);
      focusResultsRegion();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      setError(msg);
      setAreas([]);
      setCommuteOmittedEstimateOnlyCount(undefined);
      setHasSearched(true);
      focusResultsRegion();
    } finally {
      setLoading(false);
    }
  }, [form, handleSelectArea, focusResultsRegion]);

  return (
    <Box minH="100dvh" bg="gray.50" color="fg">
      <Container maxW="6xl" py={{ base: 8, md: 12 }}>
        <Stack gap={10}>
          <Stack gap={3} maxW="3xl">
            <Heading as="h1" size="3xl" fontWeight="semibold" letterSpacing="-0.03em">
              Find areas to buy
            </Heading>
            <Stack gap={1}>
              <Text fontSize="lg" color="fg.muted">
                Set your budget, commute, schools, and crime preferences — we rank{' '}
                <Text as="span" fontWeight="medium" color="fg">
                  locations
                </Text>{' '}
                first. Live listing feeds wait on commercial API access.
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Your search settings update the link in your address bar so you can bookmark or
                share them. Only the criteria are saved in the link — you choose when to run the
                search.
              </Text>
              <HStack gap={3} align="flex-start" flexWrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleCopyLink();
                  }}
                  aria-label="Copy link to this search"
                >
                  Copy shareable link
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Reset search criteria to defaults"
                  onClick={() => {
                    handleResetSearch();
                  }}
                >
                  Reset search
                </Button>
              </HStack>
              {urlMessage ? (
                <Text fontSize="xs" color="fg.warning">
                  {urlMessage}
                </Text>
              ) : null}
              {copyLinkMessage ? (
                <Text fontSize="xs" color="fg.success" role="status">
                  {copyLinkMessage}
                </Text>
              ) : null}
            </Stack>
          </Stack>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 8, lg: 10 }} alignItems="start">
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              rounded="xl"
              p={{ base: 4, md: 6 }}
              bg="white"
              shadow="sm"
            >
              <AreaSearchCriteriaForm
                form={form}
                onChange={setForm}
                onSubmit={() => {
                  void handleSearch();
                }}
                isLoading={loading}
                onGeocodeFromLabel={() => {
                  void handleGeocodeFromLabel();
                }}
                geocodeFromLabelPending={geocodePending}
                geocodeFromLabelError={geocodeError}
                geocodeFromLabelSuccess={geocodeSuccessMessage}
              />
            </Box>

            <AreaSearchResultsColumn
              resultsRegionRef={resultsRegionRef}
              selectionLiveMessage={selectionLiveMessage}
              loading={loading}
              error={error}
              hasSearched={hasSearched}
              includePriceTrendInComposite={form.includePriceTrendInComposite}
              commuteOmittedEstimateOnlyCount={commuteOmittedEstimateOnlyCount}
              areas={areas}
              compareAreas={compareAreas}
              compareIds={compareIds}
              selectedAreaId={selectedAreaId}
              workplace={workplaceForMap}
              onSelectArea={handleSelectArea}
              setCardAnchorEl={setCardAnchorEl}
              onToggleCompare={toggleCompare}
            />
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};
