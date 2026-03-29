import { Box, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';
import type { Feature, FeatureCollection } from 'geojson';
import maplibregl from 'maplibre-gl';
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url';
import { useEffect, useMemo, useRef } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

maplibregl.setWorkerUrl(maplibreglWorkerUrl);

const BASE_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const NO_SELECTION = '__no_selection__';

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

export interface ResultsMapProps {
  readonly workplace: { readonly latitude: number; readonly longitude: number } | null;
  readonly areas: readonly RankedArea[];
  readonly selectedAreaId: string | null;
  readonly onSelectArea: (id: string | null) => void;
}

export const ResultsMap = ({ workplace, areas, selectedAreaId, onSelectArea }: ResultsMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelectArea);
  const selectedRef = useRef(selectedAreaId);

  useEffect(() => {
    onSelectRef.current = onSelectArea;
  }, [onSelectArea]);

  useEffect(() => {
    selectedRef.current = selectedAreaId;
  }, [selectedAreaId]);

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
        style: BASE_STYLE,
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

      map.on('click', 'results-circles', (e) => {
        const f = e.features?.[0];
        if (f === undefined) {
          return;
        }
        const raw: unknown = f.properties;
        if (typeof raw !== 'object' || raw === null) {
          return;
        }
        const rec = raw as Record<string, unknown>;
        const kind = rec.kind;
        const id = rec.areaId;
        if (kind === 'area' && typeof id === 'string' && id.length > 0) {
          onSelectRef.current(id);
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
      />
      <Text fontSize="xs" color="fg.muted" mt={2}>
        Basemap © OpenStreetMap contributors © CARTO · Click a blue dot or a result card to
        highlight an area.
      </Text>
    </Box>
  );
};
