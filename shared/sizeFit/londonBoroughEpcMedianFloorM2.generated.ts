/**
 * **Machine-written** by `npm run ingest:epc-london-medians` from
 * [MHCLG EPC Open Data](https://epc.opendatacommunities.org/) (England & Wales register).
 * Do not hand-edit medians. Open Government Licence — follow EPC site terms.
 *
 * When empty, `resolveTypicalFloorM2ForBorough` falls back to `heuristicTypicalFloorM2.ts`.
 */
import type { PropertyTypeDto } from '../searchAreasContract';

export interface EpcMedianFloorCell {
  readonly medianM2: number;
  readonly certificateCount: number;
}

/** ISO timestamp (UTC) of last successful ingest; `null` until the first ingest. */
export const LONDON_EPC_MEDIAN_GENERATED_ISO: string | null = null;

/** Median total useful floor area (m²) per London borough slug and app property type. */
export const LONDON_BOROUGH_EPC_MEDIAN_M2: Readonly<
  Record<string, Partial<Readonly<Record<PropertyTypeDto, EpcMedianFloorCell>>>>
> = Object.freeze({});
