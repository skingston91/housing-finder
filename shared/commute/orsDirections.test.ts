import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearOrsDirectionsCache, fetchOrsRouteDurationMinutes } from './orsDirections';

describe('fetchOrsRouteDurationMinutes', () => {
  beforeEach(() => {
    clearOrsDirectionsCache();
  });

  it('parses routes[0].summary.duration seconds into minutes', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ routes: [{ summary: { duration: 1800, distance: 5000 } }] }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );
    const mins = await fetchOrsRouteDurationMinutes(
      'driving',
      51.5,
      -0.1,
      51.52,
      -0.08,
      fetchImpl,
      { apiKey: 'k' },
    );
    expect(mins).toBe(30);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    type FetchArgs = Parameters<typeof fetch>;
    const calls = fetchImpl.mock.calls as unknown as FetchArgs[];
    const firstCall = calls[0];
    expect(firstCall).toBeDefined();
    if (firstCall === undefined) {
      throw new Error('expected fetch call');
    }
    const urlArg = firstCall[0];
    let urlStr: string;
    if (typeof urlArg === 'string') {
      urlStr = urlArg;
    } else if (urlArg instanceof URL) {
      urlStr = urlArg.href;
    } else {
      urlStr = urlArg.url;
    }
    expect(urlStr).toContain('driving-car');
    const init = firstCall[1];
    expect(init?.method).toBe('POST');
    const bodyRaw = init?.body;
    expect(typeof bodyRaw === 'string' && bodyRaw.includes('-0.1')).toBe(true);
  });

  it('returns null for transit mode', async () => {
    const fetchImpl = vi.fn();
    expect(
      await fetchOrsRouteDurationMinutes('transit', 51, -0.1, 51.01, -0.1, fetchImpl, {
        apiKey: 'k',
      }),
    ).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reuses cache for same rounded coordinates', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ routes: [{ summary: { duration: 600, distance: 1000 } }] }), {
          status: 200,
        }),
      ),
    );
    const creds = { apiKey: 'k' };
    const a = await fetchOrsRouteDurationMinutes(
      'walking',
      51.5,
      -0.1,
      51.52,
      -0.08,
      fetchImpl,
      creds,
    );
    const b = await fetchOrsRouteDurationMinutes(
      'walking',
      51.50001,
      -0.10001,
      51.52001,
      -0.08001,
      fetchImpl,
      creds,
    );
    expect(a).toBe(10);
    expect(b).toBe(10);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
