/**
 * Outbound ports (Clean Architecture). Implementations live in serverless or `src/adapters/*`
 * depending on browser vs server and caching policy.
 */

import type { RankedArea } from '@/domain/area/types';
import type { AreaSearchCriteria } from '@/domain/criteria/types';

export interface AreaDiscoveryPort {
  findRankedAreas(criteria: AreaSearchCriteria): Promise<readonly RankedArea[]>;
}
