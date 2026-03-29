/**
 * Outbound ports (Clean Architecture). Implementations live in serverless or `src/adapters/*`
 * depending on browser vs server and caching policy.
 *
 * @see `.cursor/agents/architect.md`
 */

import type { RankedArea } from '@/domain/area/types';
import type { AreaSearchCriteria } from '@/domain/criteria/types';

export interface AreaDiscoveryPort {
  findRankedAreas(criteria: AreaSearchCriteria): Promise<readonly RankedArea[]>;
}

export interface GeocodedWorkplace {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
  readonly geocodeProvider?: 'mapbox' | 'nominatim';
}

/** Forward geocode a workplace label (server holds API keys and provider chain). */
export interface WorkplaceGeocodePort {
  geocodeFromLabel(query: string): Promise<GeocodedWorkplace>;
}
