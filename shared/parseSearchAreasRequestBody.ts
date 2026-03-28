import type {
  CommuteModeDto,
  PropertyTypeDto,
  SchoolPhaseDto,
  SearchAreasRequestBody,
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

  const value: SearchAreasRequestBody = {
    maxPriceGbp,
    maxPricePerM2Gbp: maxPricePerM2,
    propertyTypes,
    workplace: { label: wLabel, latitude: wLat, longitude: wLng },
    commute: { maxMinutes, mode: raw.commute.mode },
    schools: { phases, maxWalkOrDriveMinutes: maxSchoolMinutes },
    crime: { windowMonths, categoryWeights },
  };
  return { ok: true, value };
};
