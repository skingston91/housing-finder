import { describe, expect, it } from 'vitest';

import {
  buildStreetCrimesUrl,
  parseStreetCrimesResponse,
  sumWeightedCrimeCount,
} from './streetCrimes';

describe('policeUk streetCrimes', () => {
  it('buildStreetCrimesUrl encodes query', () => {
    const u = buildStreetCrimesUrl(51.5, -0.12, '2024-01');
    expect(u).toContain('lat=51.5');
    expect(u).toContain('lng=-0.12');
    expect(u).toContain('date=2024-01');
    expect(u).toContain('data.police.uk');
  });

  it('parseStreetCrimesResponse filters categories', () => {
    const rows = parseStreetCrimesResponse([{ category: 'burglary', id: 1 }, { foo: 1 }, null]);
    expect(rows).toEqual([{ category: 'burglary' }]);
  });

  it('sumWeightedCrimeCount uses map and default', () => {
    const crimes = [{ category: 'burglary' }, { category: 'unknown-cat' }];
    expect(sumWeightedCrimeCount(crimes, { burglary: 3 }, 1)).toBe(4);
  });
});
