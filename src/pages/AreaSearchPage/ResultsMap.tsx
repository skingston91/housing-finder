import { Box, Text } from '@chakra-ui/react';
import type { RankedAreaDto } from '@shared/searchAreasContract';
import type { Feature, FeatureCollection } from 'geojson';
import maplibregl from 'maplibre-gl';
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url';
import { useEffect, useRef } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

maplibregl.setWorkerUrl(maplibreglWorkerUrl);

const BASE_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export interface ResultsMapProps {
  readonly workplace: { readonly latitude: number; readonly longitude: number } | null;
  readonly areas: readonly RankedAreaDto[];
}

export const ResultsMap = ({ workplace, areas }: ResultsMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

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

    const features: Feature[] = areas.map((a) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [a.centroidLongitude, a.centroidLatitude],
      },
      properties: {
        kind: 'area',
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
        properties: { kind: 'workplace', name: 'Workplace', score: 0 },
      });
    }

    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    const onLoad = () => {
      map.addSource('results', { type: 'geojson', data: collection });
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
    };

    void map.once('load', onLoad);

    return () => {
      map.remove();
    };
  }, [workplace, areas]);

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
        Basemap © OpenStreetMap contributors © CARTO · Workplace (red) and ranked areas (blue).
      </Text>
    </Box>
  );
};
