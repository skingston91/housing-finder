import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildStreetCrimesUrl,
  clearStreetCrimesCache,
  fetchStreetCrimes,
  parseStreetCrimesResponse,
  sumWeightedCrimeCount,
} from './streetCrimes';

describe('policeUk streetCrimes', () => {
  beforeEach(() => {
    clearStreetCrimesCache();
  });
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

  it('fetchStreetCrimes returns empty array on 404', async () => {
    const fetchImpl = (): Promise<Response> => Promise.resolve(new Response('', { status: 404 }));
    const rows = await fetchStreetCrimes(51.5, -0.12, '2010-01', fetchImpl as typeof fetch);
    expect(rows).toEqual([]);
  });

  it('caches successful responses for the same rounded lat/lng and month', async () => {
    const fetchImpl = vi.fn(
      (): Promise<Response> =>
        Promise.resolve(
          new Response(JSON.stringify([{ category: 'burglary' }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    );
    const a = await fetchStreetCrimes(51.5, -0.12, '2024-06', fetchImpl as typeof fetch);
    const b = await fetchStreetCrimes(51.5, -0.12, '2024-06', fetchImpl as typeof fetch);
    expect(a).toEqual([{ category: 'burglary' }]);
    expect(b).toEqual([{ category: 'burglary' }]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fetchStreetCrimes retries then succeeds on 429', async () => {
    let n = 0;
    const fetchImpl = (): Promise<Response> => {
      n++;
      if (n < 2) {
        return Promise.resolve(new Response('', { status: 429 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify([{ category: 'burglary' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    };
    const rows = await fetchStreetCrimes(51.5, -0.12, '2024-06', fetchImpl as typeof fetch);
    expect(rows).toEqual([{ category: 'burglary' }]);
    expect(n).toBe(2);
  });
});
