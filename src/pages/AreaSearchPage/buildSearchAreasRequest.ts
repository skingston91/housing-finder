import { areaSearchCriteriaToRequestBody } from '@/adapters/mapSearchAreasContract';
import type { AreaSearchCriteria, CommuteConstraints, PropertyType } from '@/domain/criteria/types';
import type { SearchAreasRequestBody } from '@shared/searchAreasContract';

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
  schoolPhases: Set<'primary' | 'secondary' | 'sixth_form'>;
  schoolMaxMinutes: number | '';
  crimeWindowMonths: number;
  /** JSON object string for category → weight; invalid JSON falls back to defaults at submit. */
  crimeWeightsJson: string;
}

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
  schoolPhases: new Set(['primary', 'secondary']),
  schoolMaxMinutes: 20,
  crimeWindowMonths: 12,
  crimeWeightsJson: JSON.stringify(defaultCrimeWeights(), null, 2),
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

  return {
    maxPriceGbp: form.maxPriceGbp,
    maxPricePerM2Gbp,
    propertyTypes: [...form.propertyTypes],
    workplace: {
      label: form.workplaceLabel.trim(),
      latitude: form.workplaceLat,
      longitude: form.workplaceLng,
    },
    commute: {
      maxMinutes: form.commuteMaxMinutes,
      mode: form.commuteMode,
    },
    schools: {
      phases,
      maxWalkOrDriveMinutes: maxSchool,
    },
    crime: {
      windowMonths: form.crimeWindowMonths,
      categoryWeights,
    },
  };
};

export const buildSearchAreasRequest = (
  form: AreaSearchFormState,
): SearchAreasRequestBody | null => {
  const criteria = buildAreaSearchCriteria(form);
  return criteria === null ? null : areaSearchCriteriaToRequestBody(criteria);
};
