import { describe, expect, it } from 'vitest';

import {
  epcDomesticRowMatchesPropertyType,
  totalFloorAreaM2FromEpcRow,
} from './epcCertificateRowClassification';

describe('epcDomesticRowMatchesPropertyType', () => {
  it('matches semi-detached house', () => {
    expect(
      epcDomesticRowMatchesPropertyType(
        { PROPERTY_TYPE: 'House', BUILT_FORM: 'Semi-Detached' },
        'semi_detached',
      ),
    ).toBe(true);
  });

  it('normalises built-form underscores like the CSV headers', () => {
    expect(
      epcDomesticRowMatchesPropertyType(
        { PROPERTY_TYPE: 'House', BUILT_FORM: 'semi_detached' },
        'semi_detached',
      ),
    ).toBe(true);
  });

  it('matches flat and maisonette for flat bucket', () => {
    expect(epcDomesticRowMatchesPropertyType({ PROPERTY_TYPE: 'Flat' }, 'flat')).toBe(true);
    expect(epcDomesticRowMatchesPropertyType({ PROPERTY_TYPE: 'Maisonette' }, 'flat')).toBe(true);
  });

  it('rejects other', () => {
    expect(epcDomesticRowMatchesPropertyType({ PROPERTY_TYPE: 'House' }, 'other')).toBe(false);
  });
});

describe('totalFloorAreaM2FromEpcRow', () => {
  it('parses numeric area', () => {
    expect(totalFloorAreaM2FromEpcRow({ TOTAL_FLOOR_AREA: '92.5' })).toBe(92.5);
  });

  it('returns null for invalid', () => {
    expect(totalFloorAreaM2FromEpcRow({ TOTAL_FLOOR_AREA: '' })).toBe(null);
  });
});
