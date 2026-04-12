import { describe, expect, it } from 'vitest';

import { disambiguateDuplicateAreaDisplayNames } from './disambiguateDuplicateAreaDisplayNames';

describe('disambiguateDuplicateAreaDisplayNames', () => {
  it('leaves unique names unchanged', () => {
    const rows = [{ displayName: 'A', centroidLatitude: 51.5, centroidLongitude: -0.1 }];
    expect(disambiguateDuplicateAreaDisplayNames(rows)).toEqual(rows);
  });

  it('appends coordinates when two rows share a display name', () => {
    const rows = [
      { displayName: '5 km NW · Camden Town', centroidLatitude: 51.539, centroidLongitude: -0.142 },
      { displayName: '5 km NW · Camden Town', centroidLatitude: 51.531, centroidLongitude: -0.138 },
    ];
    const out = disambiguateDuplicateAreaDisplayNames(rows);
    expect(out[0]?.displayName).toContain('51.539');
    expect(out[1]?.displayName).toContain('51.531');
    expect(out[0]?.displayName).not.toBe(out[1]?.displayName);
  });
});
