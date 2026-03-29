const WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

interface WindowBucket {
  count: number;
  readonly windowStartMs: number;
}

const buckets = new Map<string, WindowBucket>();

const pruneStale = (nowMs: number): void => {
  const cutoff = nowMs - WINDOW_MS * 2;
  for (const k of [...buckets.keys()]) {
    const b = buckets.get(k);
    if (b !== undefined && b.windowStartMs < cutoff) {
      buckets.delete(k);
    }
  }
  while (buckets.size > MAX_BUCKETS) {
    const first = buckets.keys().next().value;
    if (first === undefined) {
      break;
    }
    buckets.delete(first);
  }
};

export type GeocodeRateLimitResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

/**
 * Fixed window: at most **maxPerWindow** geocode attempts per **clientKey** per minute (warm Lambda only).
 */
export const takeGeocodeRateLimitToken = (
  clientKey: string,
  maxPerWindow: number,
  nowMs = Date.now(),
): GeocodeRateLimitResult => {
  if (maxPerWindow <= 0) {
    return { allowed: true };
  }

  pruneStale(nowMs);

  const existing = buckets.get(clientKey);
  if (existing === undefined || nowMs - existing.windowStartMs >= WINDOW_MS) {
    buckets.set(clientKey, { count: 1, windowStartMs: nowMs });
    return { allowed: true };
  }

  if (existing.count < maxPerWindow) {
    existing.count += 1;
    return { allowed: true };
  }

  const elapsed = nowMs - existing.windowStartMs;
  const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000));
  return { allowed: false, retryAfterSeconds };
};

/** Test helper: clears in-memory buckets. */
export const resetGeocodeRateLimitForTests = (): void => {
  buckets.clear();
};
