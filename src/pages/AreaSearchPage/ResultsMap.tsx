import { Box, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';
import type { Feature, FeatureCollection } from 'geojson';
import maplibregl from 'maplibre-gl';
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url';
import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

maplibregl.setWorkerUrl(maplibreglWorkerUrl);

const DEFAULT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const mapStyleUrl = (): string => {
  const raw = import.meta.env.VITE_MAPLIBRE_STYLE_URL;
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : DEFAULT_MAP_STYLE;
};

const NO_SELECTION = '__no_selection__';

const buildAreaPopupEl = (props: {
  readonly name: string;
  readonly score: number;
  readonly affordability: number;
  readonly commute: number;
  readonly schools: number;
  readonly crime: number;
}): HTMLDivElement => {
  const root = document.createElement('div');
  root.style.minWidth = '188px';
  root.style.fontFamily = 'system-ui, sans-serif';
  root.style.fontSize = '12px';
  root.style.lineHeight = '1.45';
  root.style.color = '#1a202c';

  const title = document.createElement('div');
  title.style.fontWeight = '600';
  title.style.marginBottom = '6px';
  title.textContent = props.name;
  root.appendChild(title);

  const overall = document.createElement('div');
  overall.style.marginBottom = '8px';
  overall.textContent = `Overall score: ${String(props.score)}`;
  root.appendChild(overall);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'auto 1fr';
  grid.style.columnGap = '10px';
  grid.style.rowGap = '3px';

  const row = (label: string, value: number) => {
    const l = document.createElement('span');
    l.textContent = label;
    l.style.color = '#4a5568';
    const v = document.createElement('span');
    v.textContent = String(Math.round(value));
    grid.appendChild(l);
    grid.appendChild(v);
  };

  row('Affordability', props.affordability);
  row('Commute', props.commute);
  row('Schools', props.schools);
  row('Crime', props.crime);
  root.appendChild(grid);

  return root;
};

const syncResultsLayerSelection = (map: maplibregl.Map, selectedAreaId: string | null): void => {
  if (!map.getLayer('results-circles')) {
    return;
  }
  const key = selectedAreaId ?? NO_SELECTION;
  map.setPaintProperty('results-circles', 'circle-radius', [
    'case',
    ['all', ['==', ['get', 'kind'], 'area'], ['==', ['get', 'areaId'], key]],
    12,
    ['match', ['get', 'kind'], 'workplace', 10, 7],
  ]);
  map.setPaintProperty('results-circles', 'circle-color', [
    'case',
    ['all', ['==', ['get', 'kind'], 'area'], ['==', ['get', 'areaId'], key]],
    '#1a365d',
    ['match', ['get', 'kind'], 'workplace', '#c53030', '#2b6cb0'],
  ]);
};

export type AreaSelectionSource = 'map' | 'list';

export interface ResultsMapProps {
  readonly workplace: { readonly latitude: number; readonly longitude: number } | null;
  readonly areas: readonly RankedArea[];
  readonly selectedAreaId: string | null;
  /** `source` is `'map'` when the user picked a centroid on the map (used to scroll the list). */
  readonly onSelectArea: (id: string | null, source?: AreaSelectionSource) => void;
}

export const ResultsMap = ({ workplace, areas, selectedAreaId, onSelectArea }: ResultsMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelectArea);
  const selectedRef = useRef(selectedAreaId);
  const areasRef = useRef(areas);
  const mapInstructionsId = useId();

  useEffect(() => {
    onSelectRef.current = onSelectArea;
  }, [onSelectArea]);

  useEffect(() => {
    selectedRef.current = selectedAreaId;
  }, [selectedAreaId]);

  useEffect(() => {
    areasRef.current = areas;
  }, [areas]);

  const handleMapKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const list = areasRef.current;
    if (list.length === 0) {
      return;
    }

    const moveKeys = new Set([
      'ArrowDown',
      'ArrowRight',
      'ArrowUp',
      'ArrowLeft',
      'Home',
      'End',
      'Escape',
    ]);
    if (!moveKeys.has(e.key)) {
      return;
    }

    e.preventDefault();
    const selectedId = selectedRef.current;

    if (e.key === 'Escape') {
      onSelectRef.current(null, 'map');
      return;
    }

    const currentIdx = selectedId === null ? -1 : list.findIndex((a) => a.id === selectedId);

    let nextIdx = currentIdx;
    if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = list.length - 1;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextIdx = currentIdx < 0 ? 0 : Math.min(currentIdx + 1, list.length - 1);
    } else {
      nextIdx = currentIdx <= 0 ? list.length - 1 : currentIdx - 1;
    }

    const next = list[nextIdx];
    if (next !== undefined) {
      onSelectRef.current(next.id, 'map');
    }
  }, []);

  const searchFingerprint = useMemo(() => {
    const ids = areas.map((a) => a.id).join('|');
    const w =
      workplace === null ? 'none' : `${String(workplace.latitude)},${String(workplace.longitude)}`;
    return `${ids}#${w}`;
  }, [areas, workplace]);

  useEffect(() => {
    if (areas.length === 0 || containerRef.current === null) {
      return;
    }

    const el = containerRef.current;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: el,
        style: mapStyleUrl(),
      });
    } catch {
      return;
    }

    mapRef.current = map;

    const features: Feature[] = areas.map((a) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [a.centroidLongitude, a.centroidLatitude],
      },
      properties: {
        kind: 'area',
        areaId: a.id,
        name: a.displayName,
        score: Math.round(a.score),
        affordability: a.breakdown.affordability,
        commute: a.breakdown.commute,
        schools: a.breakdown.schools,
        crime: a.breakdown.crime,
      },
    }));

    if (workplace !== null) {
      features.unshift({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [workplace.longitude, workplace.latitude],
        },
        properties: { kind: 'workplace', areaId: '__workplace__', name: 'Workplace', score: 0 },
      });
    }

    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    let activePopup: maplibregl.Popup | null = null;

    const onLoad = () => {
      map.addSource('results', {
        type: 'geojson',
        data: collection,
        promoteId: 'areaId',
      });
      map.addLayer({
        id: 'results-circles',
        type: 'circle',
        source: 'results',
        paint: {
          'circle-radius': ['match', ['get', 'kind'], 'workplace', 10, 7],
          'circle-color': ['match', ['get', 'kind'], 'workplace', '#c53030', '#2b6cb0'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      const bounds = new maplibregl.LngLatBounds();
      for (const f of features) {
        const g = f.geometry;
        if (g.type === 'Point') {
          const c = g.coordinates as [number, number];
          bounds.extend(c);
        }
      }
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 0 });
      }

      syncResultsLayerSelection(map, selectedRef.current);

      map.on('click', (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['results-circles'] });
        if (hits.length === 0) {
          activePopup?.remove();
          activePopup = null;
          return;
        }

        const hit = hits[0];
        if (hit === undefined) {
          return;
        }
        const raw: unknown = hit.properties;
        if (typeof raw !== 'object' || raw === null) {
          return;
        }
        const rec = raw as Record<string, unknown>;
        const kind = rec.kind;
        const geom = hit.geometry;
        if (geom.type !== 'Point') {
          return;
        }
        const coords = geom.coordinates;
        const lng0 = coords[0];
        const lng1 = coords[1];
        if (lng0 === undefined || lng1 === undefined) {
          return;
        }
        const lngLat: [number, number] = [lng0, lng1];

        activePopup?.remove();
        activePopup = null;

        if (kind === 'workplace') {
          const tip = document.createElement('div');
          tip.style.maxWidth = '220px';
          tip.style.fontFamily = 'system-ui, sans-serif';
          tip.style.fontSize = '12px';
          tip.style.lineHeight = '1.45';
          tip.style.color = '#1a202c';
          tip.textContent = 'Your workplace — commute searches use this point as the anchor.';
          activePopup = new maplibregl.Popup({
            closeButton: true,
            maxWidth: '280px',
          })
            .setLngLat(lngLat)
            .setDOMContent(tip)
            .addTo(map);
          return;
        }

        if (kind === 'area') {
          const id = rec.areaId;
          if (typeof id !== 'string' || id.length === 0) {
            return;
          }
          const name = typeof rec.name === 'string' ? rec.name : 'Area';
          const score = typeof rec.score === 'number' ? rec.score : 0;
          const num = (k: string): number => {
            const v = rec[k];
            return typeof v === 'number' && Number.isFinite(v) ? v : 0;
          };
          onSelectRef.current(id, 'map');
          activePopup = new maplibregl.Popup({
            closeButton: true,
            maxWidth: '300px',
          })
            .setLngLat(lngLat)
            .setDOMContent(
              buildAreaPopupEl({
                name,
                score,
                affordability: num('affordability'),
                commute: num('commute'),
                schools: num('schools'),
                crime: num('crime'),
              }),
            )
            .addTo(map);
        }
      });

      map.on('mouseenter', 'results-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'results-circles', () => {
        map.getCanvas().style.cursor = '';
      });
    };

    void map.once('load', onLoad);

    return () => {
      activePopup?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchFingerprint encodes areas + workplace
  }, [searchFingerprint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('results-circles')) {
      return;
    }
    syncResultsLayerSelection(map, selectedAreaId);
  }, [selectedAreaId]);

  if (areas.length === 0) {
    return null;
  }

  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb={2}>
        Map
      </Text>
      <Box
        ref={containerRef}
        h="280px"
        w="100%"
        rounded="md"
        overflow="hidden"
        borderWidth="1px"
        borderColor="gray.200"
        bg="gray.100"
        tabIndex={0}
        role="application"
        aria-label="Ranked area centroids and workplace on a map"
        aria-describedby={mapInstructionsId}
        onKeyDown={handleMapKeyDown}
        outline="none"
        _focusVisible={{
          outline: '2px solid',
          outlineColor: 'blue.500',
          outlineOffset: '2px',
        }}
      />
      <Text id={mapInstructionsId} fontSize="xs" color="fg.muted" mt={2}>
        Basemap © OpenStreetMap contributors © CARTO · Click a dot for scores (areas) or the commute
        anchor (workplace); click the map background to close the popup. When the map is focused,
        use arrow keys to move the selection (same order as the list), Home and End for first and
        last area, Escape to clear selection. Result cards stay in sync.
      </Text>
    </Box>
  );
};
