import type { PropertyTypeDto } from '../searchAreasContract';

/** Normalise EPC text fields for comparison. */
export const normaliseEpcField = (v: unknown): string => {
  if (v === null || v === undefined) {
    return '';
  }
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v).trim().toLowerCase().replace(/\s+/g, ' ');
  }
  return '';
};

const terracedBuiltForms = new Set([
  'mid-terrace',
  'end-terrace',
  'enclosed mid-terrace',
  'enclosed end-terrace',
  'terrace',
]);

/**
 * Map a domestic EPC search row (CSV or JSON-derived) to whether it contributes to our
 * {@link PropertyTypeDto} bucket. **Ingest and tests must stay aligned** with
 * `scripts/ingest-epc-london-floor-medians.mjs`.
 */
export const epcDomesticRowMatchesPropertyType = (
  row: Readonly<Record<string, unknown>>,
  propertyType: PropertyTypeDto,
): boolean => {
  if (propertyType === 'other') {
    return false;
  }
  const prop = normaliseEpcField(row['property-type'] ?? row.PROPERTY_TYPE);
  const built = normaliseEpcField(row['built-form'] ?? row.BUILT_FORM);
  switch (propertyType) {
    case 'flat':
      return prop === 'flat' || prop === 'maisonette';
    case 'terraced':
      return prop === 'house' && terracedBuiltForms.has(built.replace(/_/g, '-'));
    case 'semi_detached':
      return prop === 'house' && built.replace(/_/g, '-') === 'semi-detached';
    case 'detached':
      return prop === 'house' && built.replace(/_/g, '-') === 'detached';
    case 'bungalow':
      return prop === 'bungalow' || (prop === 'house' && built.includes('bungalow'));
    default:
      return false;
  }
};

export const totalFloorAreaM2FromEpcRow = (
  row: Readonly<Record<string, unknown>>,
): number | null => {
  const raw = row['total-floor-area'] ?? row.TOTAL_FLOOR_AREA;
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  const n =
    typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseFloat(raw) : Number.NaN;
  if (!Number.isFinite(n) || n <= 0 || n > 2500) {
    return null;
  }
  return n;
};
