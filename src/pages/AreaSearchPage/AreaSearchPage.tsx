import {
  Alert,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { httpAreaDiscoveryAdapter } from '@/adapters/httpAreaDiscovery';
import { httpWorkplaceGeocodeAdapter } from '@/adapters/httpWorkplaceGeocode';

import type { AreaSelectionSource } from './ResultsMap';
import { AreaComparePanel } from './AreaComparePanel';
import { AreaResultCard } from './AreaResultCard';
import { AreaSearchCriteriaForm } from './AreaSearchCriteriaForm';
import { CommuteAboutDataPanel } from './CommuteAboutDataPanel';
import {
  decodeAreaSearchQueryParam,
  encodeAreaSearchQueryParam,
  MAX_AREA_SEARCH_Q_CHARS,
  parseAreaSearchQuery,
} from './areaSearchUrlState';
import { buildAreaSearchCriteria, defaultFormState } from './buildSearchAreasRequest';
import { getSelectionAnnouncement } from './selectionAnnouncement';
import { MethodologyPanel } from './MethodologyPanel';
import { resultsUseStraightLineCommute } from './searchResultsAttribution';

const ResultsMapLazy = lazy(async () => {
  const m = await import('./ResultsMap');
  return { default: m.ResultsMap };
});

export const AreaSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const skipUrlSyncRef = useRef(true);
  const [form, setForm] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultFormState();
    }
    return parseAreaSearchQuery(window.location.search) ?? defaultFormState();
  });
  const [areas, setAreas] = useState<readonly RankedArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodePending, setGeocodePending] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [selectionLiveMessage, setSelectionLiveMessage] = useState('');
  const previousSelectionRef = useRef<string | null | undefined>(undefined);
  const cardAnchorRefs = useRef(new Map<string, HTMLElement>());
  const [urlMessage, setUrlMessage] = useState<string | null>(null);

  const defaultQRef = useRef<string | null>(null);
  defaultQRef.current ??= encodeAreaSearchQueryParam(defaultFormState());

  useEffect(() => {
    setCompareIds((prev) => prev.filter((id) => areas.some((a) => a.id === id)));
  }, [areas]);

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    const currentQ = searchParams.get('q');
    const encoded = encodeAreaSearchQueryParam(form);
    if (currentQ === null && encoded === defaultQRef.current) {
      return;
    }
    if (currentQ === encoded) {
      return;
    }
    const h = window.setTimeout(() => {
      try {
        setSearchParams({ q: encoded }, { replace: false });
      } catch {
        /* ignore */
      }
    }, 450);
    return () => {
      window.clearTimeout(h);
    };
  }, [form, searchParams, setSearchParams]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (!q || q.length === 0) {
      const def = defaultFormState();
      if (encodeAreaSearchQueryParam(form) === encodeAreaSearchQueryParam(def)) {
        return;
      }
      setForm(def);
      setUrlMessage('You’re back to the default search settings.');
      return;
    }
    if (q.length > MAX_AREA_SEARCH_Q_CHARS) {
      setForm((prev) => {
        const def = defaultFormState();
        return encodeAreaSearchQueryParam(prev) === encodeAreaSearchQueryParam(def) ? prev : def;
      });
      setUrlMessage(
        "This link's search settings were too large to load, so we started from the default search.",
      );
      setSearchParams({}, { replace: true });
      return;
    }
    const decoded = decodeAreaSearchQueryParam(q);
    if (decoded === null) {
      setForm((prev) => {
        const def = defaultFormState();
        return encodeAreaSearchQueryParam(prev) === encodeAreaSearchQueryParam(def) ? prev : def;
      });
      setUrlMessage(
        'We couldn’t read the search settings from your link, so we started from the default search.',
      );
      setSearchParams({}, { replace: true });
      return;
    }
    const currentEncoded = encodeAreaSearchQueryParam(form);
    const decodedEncoded = encodeAreaSearchQueryParam(decoded);
    if (decodedEncoded === currentEncoded) {
      setUrlMessage(null);
      return;
    }
    setUrlMessage(null);
    setForm(decoded);
  }, [form, searchParams, setSearchParams]);

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
    void navigator.clipboard.writeText(window.location.href);
  }, []);

  const handleResetSearch = useCallback(() => {
    setForm(defaultFormState());
    setAreas([]);
    setError(null);
    setUrlMessage('You’re back to the default search settings.');
    setSearchParams({}, { replace: false });
  }, [setSearchParams]);

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

  const handleSearch = useCallback(async () => {
    setError(null);
    handleSelectArea(null);
    const criteria = buildAreaSearchCriteria(form);
    if (!criteria) {
      setError(
        'Check your inputs — max price (at least £1), property types, workplace, schools, and crime JSON must be valid.',
      );
      return;
    }
    setLoading(true);
    try {
      const ranked = await httpAreaDiscoveryAdapter.findRankedAreas(criteria);
      setAreas(ranked);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      setError(msg);
      setAreas([]);
    } finally {
      setLoading(false);
    }
  }, [form, handleSelectArea]);

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
                first (Jitty-style discovery). Live listing feeds wait on commercial API access.
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Your search settings update the link in your address bar so you can bookmark or
                share them. Only the criteria are saved in the link — you choose when to run the
                search.
              </Text>
              <HStack gap={3}>
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
                <Text fontSize="xs" color="orange.700">
                  {urlMessage}
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
              />
            </Box>

            <Stack gap={4} position="relative">
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
              <Heading size="md">Results</Heading>
              <CommuteAboutDataPanel />
              {!loading && areas.length > 0 && resultsUseStraightLineCommute(areas) ? (
                <Alert.Root status="warning" variant="subtle">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Commute times are approximate</Alert.Title>
                    <Alert.Description fontSize="sm">
                      At least one area used a straight-line estimate or a routing fallback — not a
                      full network journey. Configure TFL_APP_KEY (transit) and ORS_API_KEY
                      (drive/cycle/walk) on the search API for realistic routes, or enable strict
                      routing in production so misconfiguration surfaces as an error instead of
                      silent fallback.
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              ) : null}
              {!loading && areas.length > 0 ? <MethodologyPanel areas={areas} /> : null}
              {loading ? <HStackSpinner /> : null}
              {error ? (
                <Alert.Root status="error" variant="subtle">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Search error</Alert.Title>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              ) : null}
              {!loading && areas.length > 0 ? (
                <Suspense
                  fallback={
                    <Text fontSize="sm" color="fg.muted">
                      Loading map…
                    </Text>
                  }
                >
                  <ResultsMapLazy
                    workplace={workplaceForMap}
                    areas={areas}
                    selectedAreaId={selectedAreaId}
                    onSelectArea={handleSelectArea}
                  />
                </Suspense>
              ) : null}
              {!loading && areas.length > 0 && compareAreas.length >= 2 ? (
                <AreaComparePanel areas={compareAreas} />
              ) : null}
              {!loading && !error && areas.length === 0 ? (
                <Text color="fg.muted" fontSize="sm">
                  Run a search to see ranked areas. For local API + Vite together, use{' '}
                  <Text as="span" fontWeight="medium">
                    npm run dev:stack
                  </Text>{' '}
                  (or run{' '}
                  <Text as="span" fontWeight="medium">
                    npm run sam:local
                  </Text>{' '}
                  on port 3000 after{' '}
                  <Text as="span" fontWeight="medium">
                    npm run sam:build
                  </Text>
                  , plus{' '}
                  <Text as="span" fontWeight="medium">
                    npm run dev
                  </Text>
                  ). Then{' '}
                  <Text as="span" fontFamily="mono">
                    /api/search-areas
                  </Text>{' '}
                  proxies correctly — see docs/infrastructure/aws-sam.md.
                </Text>
              ) : null}
              <SimpleGrid columns={1} gap={4}>
                {areas.map((a) => (
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
                        handleSelectArea(id, 'list');
                      }}
                      compare={{
                        isInCompare: compareIds.includes(a.id),
                        onToggle: () => {
                          toggleCompare(a.id);
                        },
                        limitReached: compareIds.length >= 3 && !compareIds.includes(a.id),
                      }}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

const HStackSpinner = () => (
  <HStack gap={2}>
    <Spinner size="sm" />
    <Text fontSize="sm" color="fg.muted">
      Ranking areas…
    </Text>
  </HStack>
);
