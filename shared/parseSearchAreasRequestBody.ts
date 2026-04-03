import type {
  CommuteModeDto,
  PropertyTypeDto,
  SchoolPhaseDto,
  ScoringDto,
  SearchAreasRequestBody,
  SizeFitDto,
  TransitCommutePreferencesDto,
  TransitJourneyPreferenceDto,
} from './searchAreasContract';

const PROPERTY_TYPES: readonly PropertyTypeDto[] = [
  'flat',
  'terraced',
  'semi_detached',
  'detached',
  'bungalow',
  'other',
];

const COMMUTE_MODES: readonly CommuteModeDto[] = ['driving', 'transit', 'cycling', 'walking'];

const SCHOOL_PHASES: readonly SchoolPhaseDto[] = ['primary', 'secondary', 'sixth_form'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isPropertyType = (v: unknown): v is PropertyTypeDto =>
  typeof v === 'string' && (PROPERTY_TYPES as readonly string[]).includes(v);

const isCommuteMode = (v: unknown): v is CommuteModeDto =>
  typeof v === 'string' && (COMMUTE_MODES as readonly string[]).includes(v);

const TRANSIT_JOURNEY_PREFS: readonly TransitJourneyPreferenceDto[] = [
  'least_time',
  'least_interchange',
  'least_walking',
];

const isTransitJourneyPreference = (v: unknown): v is TransitJourneyPreferenceDto =>
  typeof v === 'string' && (TRANSIT_JOURNEY_PREFS as readonly string[]).includes(v);

const isYyyyMmDd = (s: string): boolean => {
  if (!/^\d{8}$/.test(s)) {
    return false;
  }
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

const isHhMm = (s: string): boolean => {
  if (!/^\d{4}$/.test(s)) {
    return false;
  }
  const hh = Number(s.slice(0, 2));
  const mm = Number(s.slice(2, 4));
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
};

const parseTransitPositiveInt = (v: unknown, max: number): number | null => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
    return null;
  }
  const n = Math.round(v);
  if (n > max) {
    return null;
  }
  return n;
};

/** Mutable while parsing; matches {@link TransitCommutePreferencesDto} fields. */
interface MutableTransitCommutePreferencesDto {
  journeyPreference?: TransitJourneyPreferenceDto;
  includeAlternativeRoutes?: boolean;
  requireMultipleJourneys?: boolean;
  atMostOneRailLeg?: boolean;
  atMostOnePublicTransportLeg?: boolean;
  dateYyyyMmDd?: string;
  timeHhMm?: string;
  timeIsDeparting?: boolean;
  maxWalkingMinutes?: number;
  maxTransferMinutes?: number;
  omitDefaultPlannerDeparture?: boolean;
  avoidLineIds?: string[];
}

const isSchoolPhase = (v: unknown): v is SchoolPhaseDto =>
  typeof v === 'string' && (SCHOOL_PHASES as readonly string[]).includes(v);

const parsePositiveNumber = (v: unknown, _field: string): number | null => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
    return null;
  }
  return v;
};

const parseOptionalPositiveNumber = (v: unknown, _field: string): number | undefined | null => {
  if (v === undefined) {
    return undefined;
  }
  const n = parsePositiveNumber(v, _field);
  return n ?? null;
};

const parseCategoryWeights = (v: unknown): Record<string, number> | null => {
  if (!isRecord(v)) {
    return null;
  }
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
      return null;
    }
    out[k] = val;
  }
  return out;
};

export const parseSearchAreasRequestBody = (
  raw: unknown,
): { ok: true; value: SearchAreasRequestBody } | { ok: false; error: string } => {
  if (!isRecord(raw)) {
    return { ok: false, error: 'Body must be a JSON object' };
  }

  const maxPriceGbp = parsePositiveNumber(raw.maxPriceGbp, 'maxPriceGbp');
  if (maxPriceGbp === null) {
    return { ok: false, error: 'maxPriceGbp must be a positive number' };
  }

  const maxPricePerM2 = parseOptionalPositiveNumber(raw.maxPricePerM2Gbp, 'maxPricePerM2Gbp');
  if (maxPricePerM2 === null) {
    return { ok: false, error: 'maxPricePerM2Gbp must be a positive number when provided' };
  }

  if (!Array.isArray(raw.propertyTypes) || raw.propertyTypes.length === 0) {
    return { ok: false, error: 'propertyTypes must be a non-empty array' };
  }
  const propertyTypes: PropertyTypeDto[] = [];
  for (const p of raw.propertyTypes) {
    if (!isPropertyType(p)) {
      return { ok: false, error: `Invalid property type: ${String(p)}` };
    }
    propertyTypes.push(p);
  }

  if (!isRecord(raw.workplace)) {
    return { ok: false, error: 'workplace must be an object' };
  }
  const wLat = typeof raw.workplace.latitude === 'number' ? raw.workplace.latitude : NaN;
  const wLng = typeof raw.workplace.longitude === 'number' ? raw.workplace.longitude : NaN;
  const wLabel = typeof raw.workplace.label === 'string' ? raw.workplace.label.trim() : '';
  if (!wLabel) {
    return { ok: false, error: 'workplace.label is required' };
  }
  if (!Number.isFinite(wLat) || !Number.isFinite(wLng)) {
    return { ok: false, error: 'workplace latitude and longitude must be numbers' };
  }

  if (!isRecord(raw.commute)) {
    return { ok: false, error: 'commute must be an object' };
  }
  const maxMinutes = parsePositiveNumber(raw.commute.maxMinutes, 'commute.maxMinutes');
  if (maxMinutes === null) {
    return { ok: false, error: 'commute.maxMinutes must be a positive number' };
  }
  if (!isCommuteMode(raw.commute.mode)) {
    return { ok: false, error: 'commute.mode is invalid' };
  }

  let transit: TransitCommutePreferencesDto | undefined;
  if (raw.commute.transit !== undefined) {
    if (!isRecord(raw.commute.transit)) {
      return { ok: false, error: 'commute.transit must be an object' };
    }
    const tr = raw.commute.transit;
    const t: MutableTransitCommutePreferencesDto = {};
    if (tr.journeyPreference !== undefined) {
      if (!isTransitJourneyPreference(tr.journeyPreference)) {
        return { ok: false, error: 'commute.transit.journeyPreference is invalid' };
      }
      t.journeyPreference = tr.journeyPreference;
    }
    if (tr.includeAlternativeRoutes !== undefined) {
      if (typeof tr.includeAlternativeRoutes !== 'boolean') {
        return { ok: false, error: 'commute.transit.includeAlternativeRoutes must be a boolean' };
      }
      t.includeAlternativeRoutes = tr.includeAlternativeRoutes;
    }
    if (tr.requireMultipleJourneys !== undefined) {
      if (typeof tr.requireMultipleJourneys !== 'boolean') {
        return { ok: false, error: 'commute.transit.requireMultipleJourneys must be a boolean' };
      }
      t.requireMultipleJourneys = tr.requireMultipleJourneys;
    }
    if (tr.atMostOneRailLeg !== undefined) {
      if (typeof tr.atMostOneRailLeg !== 'boolean') {
        return { ok: false, error: 'commute.transit.atMostOneRailLeg must be a boolean' };
      }
      t.atMostOneRailLeg = tr.atMostOneRailLeg;
    }
    if (tr.atMostOnePublicTransportLeg !== undefined) {
      if (typeof tr.atMostOnePublicTransportLeg !== 'boolean') {
        return {
          ok: false,
          error: 'commute.transit.atMostOnePublicTransportLeg must be a boolean',
        };
      }
      t.atMostOnePublicTransportLeg = tr.atMostOnePublicTransportLeg;
    }
    const dOpt = tr.dateYyyyMmDd;
    const tTime = tr.timeHhMm;
    if ((dOpt !== undefined) !== (tTime !== undefined)) {
      return {
        ok: false,
        error:
          'commute.transit.dateYyyyMmDd and timeHhMm must both be provided together, or neither',
      };
    }
    if (dOpt !== undefined) {
      if (typeof dOpt !== 'string' || typeof tTime !== 'string') {
        return { ok: false, error: 'commute.transit.dateYyyyMmDd and timeHhMm must be strings' };
      }
      if (!isYyyyMmDd(dOpt)) {
        return {
          ok: false,
          error: 'commute.transit.dateYyyyMmDd must be yyyymmdd and a real calendar date',
        };
      }
      if (!isHhMm(tTime)) {
        return {
          ok: false,
          error: 'commute.transit.timeHhMm must be hhmm using 24h clock',
        };
      }
      t.dateYyyyMmDd = dOpt;
      t.timeHhMm = tTime;
      if (tr.timeIsDeparting !== undefined) {
        if (typeof tr.timeIsDeparting !== 'boolean') {
          return { ok: false, error: 'commute.transit.timeIsDeparting must be a boolean' };
        }
        t.timeIsDeparting = tr.timeIsDeparting;
      }
    }
    if (tr.maxWalkingMinutes !== undefined) {
      const w = parseTransitPositiveInt(tr.maxWalkingMinutes, 240);
      if (w === null) {
        return {
          ok: false,
          error: 'commute.transit.maxWalkingMinutes must be a positive integer up to 240',
        };
      }
      t.maxWalkingMinutes = w;
    }
    if (tr.maxTransferMinutes !== undefined) {
      const x = parseTransitPositiveInt(tr.maxTransferMinutes, 240);
      if (x === null) {
        return {
          ok: false,
          error: 'commute.transit.maxTransferMinutes must be a positive integer up to 240',
        };
      }
      t.maxTransferMinutes = x;
    }
    if (tr.omitDefaultPlannerDeparture !== undefined) {
      if (typeof tr.omitDefaultPlannerDeparture !== 'boolean') {
        return {
          ok: false,
          error: 'commute.transit.omitDefaultPlannerDeparture must be a boolean',
        };
      }
      t.omitDefaultPlannerDeparture = tr.omitDefaultPlannerDeparture;
    }
    if (tr.avoidLineIds !== undefined) {
      if (!Array.isArray(tr.avoidLineIds)) {
        return { ok: false, error: 'commute.transit.avoidLineIds must be an array of strings' };
      }
      const ids: string[] = [];
      for (const x of tr.avoidLineIds) {
        if (typeof x !== 'string' || x.trim().length === 0) {
          return {
            ok: false,
            error: 'commute.transit.avoidLineIds entries must be non-empty strings',
          };
        }
        ids.push(x.trim());
      }
      t.avoidLineIds = ids;
    }
    transit = t as TransitCommutePreferencesDto;
  }

  if (!isRecord(raw.schools)) {
    return { ok: false, error: 'schools must be an object' };
  }
  if (!Array.isArray(raw.schools.phases) || raw.schools.phases.length === 0) {
    return { ok: false, error: 'schools.phases must be a non-empty array' };
  }
  const phases: SchoolPhaseDto[] = [];
  for (const ph of raw.schools.phases) {
    if (!isSchoolPhase(ph)) {
      return { ok: false, error: `Invalid school phase: ${String(ph)}` };
    }
    phases.push(ph);
  }
  const maxSchoolMinutes = parseOptionalPositiveNumber(
    raw.schools.maxWalkOrDriveMinutes,
    'schools.maxWalkOrDriveMinutes',
  );
  if (maxSchoolMinutes === null) {
    return { ok: false, error: 'schools.maxWalkOrDriveMinutes must be positive when provided' };
  }

  if (!isRecord(raw.crime)) {
    return { ok: false, error: 'crime must be an object' };
  }
  const windowMonths = parsePositiveNumber(raw.crime.windowMonths, 'crime.windowMonths');
  if (windowMonths === null) {
    return { ok: false, error: 'crime.windowMonths must be a positive number' };
  }
  const categoryWeights = parseCategoryWeights(raw.crime.categoryWeights);
  if (categoryWeights === null) {
    return { ok: false, error: 'crime.categoryWeights must be an object of non-negative numbers' };
  }

  let scoring: ScoringDto | undefined;
  if (raw.scoring !== undefined) {
    if (!isRecord(raw.scoring)) {
      return { ok: false, error: 'scoring must be an object' };
    }
    if (raw.scoring.includePriceTrendInComposite !== undefined) {
      if (typeof raw.scoring.includePriceTrendInComposite !== 'boolean') {
        return { ok: false, error: 'scoring.includePriceTrendInComposite must be a boolean' };
      }
      scoring = { includePriceTrendInComposite: raw.scoring.includePriceTrendInComposite };
    }
  }

  let sizeFit: SizeFitDto | undefined;
  if (raw.sizeFit !== undefined) {
    if (!isRecord(raw.sizeFit)) {
      return { ok: false, error: 'sizeFit must be an object' };
    }
    const minM2 = parsePositiveNumber(raw.sizeFit.minFloorAreaM2, 'sizeFit.minFloorAreaM2');
    if (minM2 === null) {
      return { ok: false, error: 'sizeFit.minFloorAreaM2 must be a positive number' };
    }
    if (minM2 < 8 || minM2 > 1500) {
      return {
        ok: false,
        error: 'sizeFit.minFloorAreaM2 must be between 8 and 1500 square metres',
      };
    }
    sizeFit = { minFloorAreaM2: Math.round(minM2 * 100) / 100 };
  }

  const value: SearchAreasRequestBody = {
    maxPriceGbp,
    maxPricePerM2Gbp: maxPricePerM2,
    propertyTypes,
    workplace: { label: wLabel, latitude: wLat, longitude: wLng },
    commute: {
      maxMinutes,
      mode: raw.commute.mode,
      ...(transit !== undefined ? { transit } : {}),
    },
    schools: { phases, maxWalkOrDriveMinutes: maxSchoolMinutes },
    crime: { windowMonths, categoryWeights },
    ...(scoring !== undefined ? { scoring } : {}),
    ...(sizeFit !== undefined ? { sizeFit } : {}),
  };
  return { ok: true, value };
};
