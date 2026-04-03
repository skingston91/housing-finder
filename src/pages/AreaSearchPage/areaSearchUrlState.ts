import type { PropertyType } from '@/domain/criteria/types';

import { defaultFormState, type AreaSearchFormState } from './buildSearchAreasRequest';

const URL_PARAM_VERSION = 1;

/** Max length of raw `q` before base64 decode (defence in depth). */
export const MAX_AREA_SEARCH_Q_CHARS = 64_000;

const PROPERTY_TYPES: ReadonlySet<string> = new Set([
  'flat',
  'terraced',
  'semi_detached',
  'detached',
  'bungalow',
  'other',
]);

const COMMUTE_MODES: ReadonlySet<string> = new Set(['driving', 'transit', 'cycling', 'walking']);

const TRANSIT_PREFS: ReadonlySet<string> = new Set([
  'least_time',
  'least_interchange',
  'least_walking',
]);

const SCHOOL_PHASES: ReadonlySet<string> = new Set(['primary', 'secondary', 'sixth_form']);

const isPropertyType = (v: unknown): v is PropertyType =>
  typeof v === 'string' && PROPERTY_TYPES.has(v);

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let bin = '';
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlToBytes = (s: string): Uint8Array | null => {
  try {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    let i = 0;
    for (const codeUnit of bin) {
      out[i] = codeUnit.charCodeAt(0);
      i += 1;
    }
    return out;
  } catch {
    return null;
  }
};

interface WireForm {
  readonly v?: unknown;
  readonly maxPriceGbp?: unknown;
  readonly maxPricePerM2Gbp?: unknown;
  readonly propertyTypes?: unknown;
  readonly workplaceLabel?: unknown;
  readonly workplaceLat?: unknown;
  readonly workplaceLng?: unknown;
  readonly commuteMaxMinutes?: unknown;
  readonly commuteMode?: unknown;
  readonly transitJourneyPreference?: unknown;
  readonly transitIncludeAlternativeRoutes?: unknown;
  readonly transitAvoidLineIds?: unknown;
  readonly transitRequireMultipleJourneys?: unknown;
  readonly transitAtMostOneRailLeg?: unknown;
  readonly transitAtMostOnePublicTransportLeg?: unknown;
  readonly transitPlannerDate?: unknown;
  readonly transitPlannerTime?: unknown;
  readonly transitArriveBy?: unknown;
  readonly transitMaxWalkingMinutes?: unknown;
  readonly transitMaxTransferMinutes?: unknown;
  readonly transitOmitDefaultPlannerDeparture?: unknown;
  readonly schoolPhases?: unknown;
  readonly schoolMaxMinutes?: unknown;
  readonly crimeWindowMonths?: unknown;
  readonly crimeWeightsJson?: unknown;
  readonly includePriceTrendInComposite?: unknown;
  readonly minInternalFloorArea?: unknown;
  readonly minInternalFloorAreaUnit?: unknown;
}

const toFormState = (w: WireForm): AreaSearchFormState | null => {
  if (
    (typeof w.maxPriceGbp !== 'number' && w.maxPriceGbp !== '') ||
    typeof w.workplaceLabel !== 'string' ||
    typeof w.commuteMaxMinutes !== 'number' ||
    typeof w.commuteMode !== 'string' ||
    !COMMUTE_MODES.has(w.commuteMode) ||
    typeof w.crimeWindowMonths !== 'number' ||
    typeof w.crimeWeightsJson !== 'string' ||
    !Array.isArray(w.propertyTypes) ||
    !Array.isArray(w.schoolPhases)
  ) {
    return null;
  }
  const propertyTypes: PropertyType[] = [];
  for (const p of w.propertyTypes) {
    if (!isPropertyType(p)) {
      return null;
    }
    propertyTypes.push(p);
  }
  if (propertyTypes.length === 0) {
    return null;
  }
  const phases = new Set<'primary' | 'secondary' | 'sixth_form'>();
  for (const ph of w.schoolPhases) {
    if (typeof ph !== 'string' || !SCHOOL_PHASES.has(ph)) {
      return null;
    }
    phases.add(ph as 'primary' | 'secondary' | 'sixth_form');
  }
  if (phases.size === 0) {
    return null;
  }

  const maxPricePerM2Gbp =
    w.maxPricePerM2Gbp === undefined || w.maxPricePerM2Gbp === ''
      ? ''
      : typeof w.maxPricePerM2Gbp === 'number'
        ? w.maxPricePerM2Gbp
        : null;
  if (maxPricePerM2Gbp === null) {
    return null;
  }

  const workplaceLat =
    w.workplaceLat === '' ? '' : typeof w.workplaceLat === 'number' ? w.workplaceLat : null;
  const workplaceLng =
    w.workplaceLng === '' ? '' : typeof w.workplaceLng === 'number' ? w.workplaceLng : null;
  if (workplaceLat === null || workplaceLng === null) {
    return null;
  }

  const jp =
    typeof w.transitJourneyPreference === 'string' && TRANSIT_PREFS.has(w.transitJourneyPreference)
      ? w.transitJourneyPreference
      : null;
  if (jp === null) {
    return null;
  }

  const schoolMaxMinutes =
    w.schoolMaxMinutes === undefined || w.schoolMaxMinutes === ''
      ? ''
      : typeof w.schoolMaxMinutes === 'number'
        ? w.schoolMaxMinutes
        : null;
  if (schoolMaxMinutes === null) {
    return null;
  }

  const tw =
    w.transitMaxWalkingMinutes === undefined || w.transitMaxWalkingMinutes === ''
      ? ''
      : typeof w.transitMaxWalkingMinutes === 'number'
        ? w.transitMaxWalkingMinutes
        : null;
  const tx =
    w.transitMaxTransferMinutes === undefined || w.transitMaxTransferMinutes === ''
      ? ''
      : typeof w.transitMaxTransferMinutes === 'number'
        ? w.transitMaxTransferMinutes
        : null;
  if (tw === null || tx === null) {
    return null;
  }

  if (
    typeof w.transitIncludeAlternativeRoutes !== 'boolean' ||
    typeof w.transitRequireMultipleJourneys !== 'boolean' ||
    typeof w.transitAtMostOneRailLeg !== 'boolean' ||
    typeof w.transitAtMostOnePublicTransportLeg !== 'boolean' ||
    typeof w.transitArriveBy !== 'boolean' ||
    typeof w.transitOmitDefaultPlannerDeparture !== 'boolean' ||
    typeof w.transitAvoidLineIds !== 'string' ||
    typeof w.transitPlannerDate !== 'string' ||
    typeof w.transitPlannerTime !== 'string'
  ) {
    return null;
  }

  if (
    w.includePriceTrendInComposite !== undefined &&
    typeof w.includePriceTrendInComposite !== 'boolean'
  ) {
    return null;
  }

  let minInternalFloorArea: number | '' = '';
  if (w.minInternalFloorArea !== undefined && w.minInternalFloorArea !== '') {
    if (typeof w.minInternalFloorArea !== 'number') {
      return null;
    }
    minInternalFloorArea = w.minInternalFloorArea;
  }
  let minInternalFloorAreaUnit: 'sqft' | 'm2' = 'sqft';
  if (w.minInternalFloorAreaUnit !== undefined) {
    if (w.minInternalFloorAreaUnit !== 'sqft' && w.minInternalFloorAreaUnit !== 'm2') {
      return null;
    }
    minInternalFloorAreaUnit = w.minInternalFloorAreaUnit;
  }

  const maxPrice: number | '' = w.maxPriceGbp === '' ? '' : w.maxPriceGbp;

  return {
    maxPriceGbp: maxPrice,
    maxPricePerM2Gbp,
    propertyTypes,
    workplaceLabel: w.workplaceLabel,
    workplaceLat,
    workplaceLng,
    commuteMaxMinutes: w.commuteMaxMinutes,
    commuteMode: w.commuteMode as AreaSearchFormState['commuteMode'],
    transitJourneyPreference: jp as AreaSearchFormState['transitJourneyPreference'],
    transitIncludeAlternativeRoutes: w.transitIncludeAlternativeRoutes,
    transitAvoidLineIds: w.transitAvoidLineIds,
    transitRequireMultipleJourneys: w.transitRequireMultipleJourneys,
    transitAtMostOneRailLeg: w.transitAtMostOneRailLeg,
    transitAtMostOnePublicTransportLeg: w.transitAtMostOnePublicTransportLeg,
    transitPlannerDate: w.transitPlannerDate,
    transitPlannerTime: w.transitPlannerTime,
    transitArriveBy: w.transitArriveBy,
    transitMaxWalkingMinutes: tw,
    transitMaxTransferMinutes: tx,
    transitOmitDefaultPlannerDeparture: w.transitOmitDefaultPlannerDeparture,
    schoolPhases: phases,
    schoolMaxMinutes,
    crimeWindowMonths: w.crimeWindowMonths,
    crimeWeightsJson: w.crimeWeightsJson,
    includePriceTrendInComposite:
      typeof w.includePriceTrendInComposite === 'boolean' ? w.includePriceTrendInComposite : false,
    minInternalFloorArea,
    minInternalFloorAreaUnit,
  };
};

/** Base64url JSON of {@link AreaSearchFormState} for the **`q`** query param. */
export const encodeAreaSearchQueryParam = (form: AreaSearchFormState): string => {
  const payload = {
    v: URL_PARAM_VERSION,
    maxPriceGbp: form.maxPriceGbp,
    maxPricePerM2Gbp: form.maxPricePerM2Gbp,
    propertyTypes: [...form.propertyTypes],
    workplaceLabel: form.workplaceLabel,
    workplaceLat: form.workplaceLat,
    workplaceLng: form.workplaceLng,
    commuteMaxMinutes: form.commuteMaxMinutes,
    commuteMode: form.commuteMode,
    transitJourneyPreference: form.transitJourneyPreference,
    transitIncludeAlternativeRoutes: form.transitIncludeAlternativeRoutes,
    transitAvoidLineIds: form.transitAvoidLineIds,
    transitRequireMultipleJourneys: form.transitRequireMultipleJourneys,
    transitAtMostOneRailLeg: form.transitAtMostOneRailLeg,
    transitAtMostOnePublicTransportLeg: form.transitAtMostOnePublicTransportLeg,
    transitPlannerDate: form.transitPlannerDate,
    transitPlannerTime: form.transitPlannerTime,
    transitArriveBy: form.transitArriveBy,
    transitMaxWalkingMinutes: form.transitMaxWalkingMinutes,
    transitMaxTransferMinutes: form.transitMaxTransferMinutes,
    transitOmitDefaultPlannerDeparture: form.transitOmitDefaultPlannerDeparture,
    schoolPhases: [...form.schoolPhases],
    schoolMaxMinutes: form.schoolMaxMinutes,
    crimeWindowMonths: form.crimeWindowMonths,
    crimeWeightsJson: form.crimeWeightsJson,
    includePriceTrendInComposite: form.includePriceTrendInComposite,
    minInternalFloorArea: form.minInternalFloorArea,
    minInternalFloorAreaUnit: form.minInternalFloorAreaUnit,
  };
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
};

export const decodeAreaSearchQueryParam = (qRaw: string): AreaSearchFormState | null => {
  if (qRaw.length > MAX_AREA_SEARCH_Q_CHARS) {
    return null;
  }
  const bytes = base64UrlToBytes(qRaw);
  if (bytes === null) {
    return null;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const w = raw as WireForm;
  if (w.v !== URL_PARAM_VERSION) {
    return null;
  }
  return toFormState(w);
};

/** Parse **`?…q=…`** from a full `location.search` string. */
export const parseAreaSearchQuery = (search: string): AreaSearchFormState | null => {
  const qs = search.startsWith('?') ? search.slice(1) : search;
  const q = new URLSearchParams(qs).get('q');
  if (q === null || q.length === 0) {
    return null;
  }
  return decodeAreaSearchQueryParam(q);
};

/** True when two form states round-trip to the same `q` string (canonical comparison). */
export const areaSearchFormsEncodeToSameQueryParam = (
  a: AreaSearchFormState,
  b: AreaSearchFormState,
): boolean => encodeAreaSearchQueryParam(a) === encodeAreaSearchQueryParam(b);

/** Initial form for SSR (no `window`) or browser from `window.location.search`. */
export const getInitialAreaSearchFormFromWindow = (): AreaSearchFormState => {
  if (typeof globalThis.window === 'undefined') {
    return defaultFormState();
  }
  return parseAreaSearchQuery(globalThis.window.location.search) ?? defaultFormState();
};
