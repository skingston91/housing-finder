import { areaSearchCriteriaToRequestBody } from '@/adapters/mapSearchAreasContract';
import type {
  AreaSearchCriteria,
  AreaSearchSizeFit,
  CommuteConstraints,
  PropertyType,
  TransitJourneyPreference,
} from '@/domain/criteria/types';
import type { SearchAreasRequestBody } from '@shared/searchAreasContract';

/** Convert imperial floor area to m² (exact definition of international foot). */
const SQ_FT_TO_SQM = 0.09290304;
const SIZE_FIT_MIN_M2 = 8;
const SIZE_FIT_MAX_M2 = 1500;

export interface AreaSearchFormState {
  /** Empty while the user clears the field to type a new value (avoids `Number('')` → 0). */
  maxPriceGbp: number | '';
  maxPricePerM2Gbp: number | '';
  propertyTypes: readonly PropertyType[];
  workplaceLabel: string;
  workplaceLat: number | '';
  workplaceLng: number | '';
  commuteMaxMinutes: number;
  commuteMode: CommuteConstraints['mode'];
  /** Used when `commuteMode` is `transit`. */
  transitJourneyPreference: TransitJourneyPreference;
  transitIncludeAlternativeRoutes: boolean;
  transitAvoidLineIds: string;
  transitRequireMultipleJourneys: boolean;
  transitAtMostOneRailLeg: boolean;
  transitAtMostOnePublicTransportLeg: boolean;
  /** HTML `input type="date"` value `yyyy-MM-dd`; optional with `transitPlannerTime`. */
  transitPlannerDate: string;
  /** HTML `input type="time"` value `HH:MM`; optional with `transitPlannerDate`. */
  transitPlannerTime: string;
  /** When set with date+time, interpret as **arrive by** (`timeIsDeparting: false`). */
  transitArriveBy: boolean;
  transitMaxWalkingMinutes: number | '';
  transitMaxTransferMinutes: number | '';
  /** When true, do not use the weekday 08:30 London default in TfL when date/time are blank. */
  transitOmitDefaultPlannerDeparture: boolean;
  schoolPhases: Set<'primary' | 'secondary' | 'sixth_form'>;
  schoolMaxMinutes: number | '';
  crimeWindowMonths: number;
  /** JSON object string for category → weight; invalid JSON falls back to defaults at submit. */
  crimeWeightsJson: string;
  /** When true, UK HPI YoY borough momentum is blended into the composite score. */
  includePriceTrendInComposite: boolean;
  /** Optional minimum internal floor area; empty when not used. */
  minInternalFloorArea: number | '';
  minInternalFloorAreaUnit: 'sqft' | 'm2';
}

const toPlannerYyyyMmDd = (htmlDate: string): string | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(htmlDate.trim());
  if (m === null) {
    return null;
  }
  const y = m[1];
  const mo = m[2];
  const d = m[3];
  if (y === undefined || mo === undefined || d === undefined) {
    return null;
  }
  return `${y}${mo}${d}`;
};

const toPlannerHhMm = (htmlTime: string): string | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(htmlTime.trim());
  if (m === null) {
    return null;
  }
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return `${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}`;
};

export const defaultCrimeWeights = (): Record<string, number> => ({
  'anti-social-behaviour': 1,
  burglary: 2,
  robbery: 3,
  violence: 2,
  'vehicle-crime': 1,
});

export const defaultFormState = (): AreaSearchFormState => ({
  maxPriceGbp: 450_000,
  maxPricePerM2Gbp: '',
  propertyTypes: ['flat', 'terraced'],
  workplaceLabel: 'Old Street',
  workplaceLat: 51.5255,
  workplaceLng: -0.0875,
  commuteMaxMinutes: 45,
  commuteMode: 'transit',
  transitJourneyPreference: 'least_time',
  transitIncludeAlternativeRoutes: false,
  transitAvoidLineIds: '',
  transitRequireMultipleJourneys: false,
  transitAtMostOneRailLeg: false,
  transitAtMostOnePublicTransportLeg: false,
  transitPlannerDate: '',
  transitPlannerTime: '',
  transitArriveBy: false,
  transitMaxWalkingMinutes: '',
  transitMaxTransferMinutes: '',
  transitOmitDefaultPlannerDeparture: false,
  schoolPhases: new Set(['primary', 'secondary']),
  schoolMaxMinutes: 20,
  crimeWindowMonths: 12,
  crimeWeightsJson: JSON.stringify(defaultCrimeWeights(), null, 2),
  includePriceTrendInComposite: false,
  minInternalFloorArea: '',
  minInternalFloorAreaUnit: 'sqft',
});

/** Validates the area-search form and returns domain criteria (inner model). */
export const buildAreaSearchCriteria = (form: AreaSearchFormState): AreaSearchCriteria | null => {
  if (form.maxPriceGbp === '' || !Number.isFinite(form.maxPriceGbp) || form.maxPriceGbp < 1) {
    return null;
  }
  if (form.propertyTypes.length === 0) {
    return null;
  }
  if (!form.workplaceLabel.trim()) {
    return null;
  }
  if (form.workplaceLat === '' || form.workplaceLng === '') {
    return null;
  }

  let categoryWeights: Record<string, number>;
  try {
    const parsed: unknown = JSON.parse(form.crimeWeightsJson);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    categoryWeights = {};
    for (const [k, val] of Object.entries(parsed)) {
      if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
        return null;
      }
      categoryWeights[k] = val;
    }
  } catch {
    return null;
  }

  if (form.schoolPhases.size === 0) {
    return null;
  }

  const phases = [...form.schoolPhases];
  const maxPricePerM2Gbp = form.maxPricePerM2Gbp === '' ? undefined : form.maxPricePerM2Gbp;
  const maxSchool = form.schoolMaxMinutes === '' ? undefined : form.schoolMaxMinutes;

  const avoidLineIds = form.transitAvoidLineIds
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const hasPlannerDate = form.transitPlannerDate.trim().length > 0;
  const hasPlannerTime = form.transitPlannerTime.trim().length > 0;
  if (hasPlannerDate !== hasPlannerTime) {
    return null;
  }
  const plannerDate =
    hasPlannerDate && hasPlannerTime ? toPlannerYyyyMmDd(form.transitPlannerDate) : null;
  const plannerTime =
    hasPlannerDate && hasPlannerTime ? toPlannerHhMm(form.transitPlannerTime) : null;
  if (
    hasPlannerDate &&
    (plannerDate === null ||
      plannerTime === null ||
      plannerDate.length !== 8 ||
      plannerTime.length !== 4)
  ) {
    return null;
  }
  const maxWalk = form.transitMaxWalkingMinutes === '' ? undefined : form.transitMaxWalkingMinutes;
  const maxXfer =
    form.transitMaxTransferMinutes === '' ? undefined : form.transitMaxTransferMinutes;
  if (maxWalk !== undefined && (!Number.isFinite(maxWalk) || maxWalk < 1 || maxWalk > 240)) {
    return null;
  }
  if (maxXfer !== undefined && (!Number.isFinite(maxXfer) || maxXfer < 1 || maxXfer > 240)) {
    return null;
  }

  let sizeFit: AreaSearchSizeFit | undefined;
  if (form.minInternalFloorArea !== '') {
    const v = form.minInternalFloorArea;
    const m2 = form.minInternalFloorAreaUnit === 'sqft' ? v * SQ_FT_TO_SQM : v;
    if (!Number.isFinite(m2) || m2 < SIZE_FIT_MIN_M2 || m2 > SIZE_FIT_MAX_M2) {
      return null;
    }
    sizeFit = { minFloorAreaM2: Math.round(m2 * 100) / 100 };
  }

  const commute: CommuteConstraints =
    form.commuteMode === 'transit'
      ? {
          maxMinutes: form.commuteMaxMinutes,
          mode: 'transit',
          transit: {
            journeyPreference: form.transitJourneyPreference,
            ...(form.transitIncludeAlternativeRoutes ? { includeAlternativeRoutes: true } : {}),
            ...(avoidLineIds.length > 0 ? { avoidLineIds } : {}),
            ...(form.transitRequireMultipleJourneys ? { requireMultipleJourneys: true } : {}),
            ...(form.transitAtMostOneRailLeg ? { atMostOneRailLeg: true } : {}),
            ...(form.transitAtMostOnePublicTransportLeg
              ? { atMostOnePublicTransportLeg: true }
              : {}),
            ...(plannerDate !== null && plannerTime !== null
              ? {
                  dateYyyyMmDd: plannerDate,
                  timeHhMm: plannerTime,
                  ...(form.transitArriveBy ? { timeIsDeparting: false } : {}),
                }
              : {}),
            ...(maxWalk !== undefined ? { maxWalkingMinutes: Math.round(maxWalk) } : {}),
            ...(maxXfer !== undefined ? { maxTransferMinutes: Math.round(maxXfer) } : {}),
            ...(form.transitOmitDefaultPlannerDeparture
              ? { omitDefaultPlannerDeparture: true }
              : {}),
          },
        }
      : {
          maxMinutes: form.commuteMaxMinutes,
          mode: form.commuteMode,
        };

  return {
    maxPriceGbp: form.maxPriceGbp,
    maxPricePerM2Gbp,
    propertyTypes: [...form.propertyTypes],
    workplace: {
      label: form.workplaceLabel.trim(),
      latitude: form.workplaceLat,
      longitude: form.workplaceLng,
    },
    commute,
    schools: {
      phases,
      maxWalkOrDriveMinutes: maxSchool,
    },
    crime: {
      windowMonths: form.crimeWindowMonths,
      categoryWeights,
    },
    ...(form.includePriceTrendInComposite
      ? { scoring: { includePriceTrendInComposite: true } }
      : {}),
    ...(sizeFit !== undefined ? { sizeFit } : {}),
  };
};

export const buildSearchAreasRequest = (
  form: AreaSearchFormState,
): SearchAreasRequestBody | null => {
  const criteria = buildAreaSearchCriteria(form);
  return criteria === null ? null : areaSearchCriteriaToRequestBody(criteria);
};
