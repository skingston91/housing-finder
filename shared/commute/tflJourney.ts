import { resolveDefaultLondonWeekdayMorningDeparture } from './tflDefaultLondonDeparture';

const TFL_ORIGIN = 'https://api.tfl.gov.uk';

const MODES_WITH_NATIONAL_RAIL =
  'tube,bus,dlr,tram,overground,tflrail,elizabeth-line,national-rail,walking';
const MODES_WITHOUT_NATIONAL_RAIL = 'tube,bus,dlr,tram,overground,tflrail,elizabeth-line,walking';

const RATE_LIMIT_RETRY_MS = 450;
const CACHE_TTL_SUCCESS_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

/** TfL only requires **`app_key`** as a query parameter; do not send `app_id` (deprecated per TfL). */
export interface TflApiCredentials {
  readonly appKey: string;
}

/** Optional tuning for TfL Journey Planner (transit commute). */
export interface TflTransitPlannerPreferences {
  readonly journeyPreference?: 'least_time' | 'least_interchange' | 'least_walking';
  readonly includeAlternativeRoutes?: boolean;
  /** TfL line ids (e.g. `victoria`, `northern`). Case-insensitive. Journeys using any line are excluded. */
  readonly avoidLineIds?: readonly string[];
  /** Require at least two qualifying journeys (`includeAlternativeRoutes` recommended). */
  readonly requireMultipleJourneys?: boolean;
  /** Keep journeys with at most one rail-like leg (tube, DLR, tram, Overground, Elizabeth line, TfL Rail, national rail). */
  readonly atMostOneRailLeg?: boolean;
  /** At most one non-walking leg (strict “single vehicle / one hop” style). */
  readonly atMostOnePublicTransportLeg?: boolean;
  /** TfL `date` query: **yyyyMMdd**. Must be sent with {@link timeHhMm}. */
  readonly dateYyyyMmDd?: string;
  /** TfL `time` query: **HHmm** (24h). Must be sent with {@link dateYyyyMmDd}. */
  readonly timeHhMm?: string;
  /** Whether `time` is departure or arrival (TfL: `Departing` / `Arriving`). */
  readonly timeIsDeparting?: boolean;
  /** TfL `maxWalkingMinutes`. */
  readonly maxWalkingMinutes?: number;
  /** TfL `maxTransferMinutes`. */
  readonly maxTransferMinutes?: number;
  /**
   * When **true**, do not inject the weekday **08:30 Europe/London** default when date/time are unset
   * (TfL uses its own clock default instead).
   */
  readonly omitDefaultPlannerDeparture?: boolean;
}

export type TflTransitFailureCode =
  | 'http_error'
  | 'json_parse_error'
  | 'invalid_payload'
  | 'empty_journeys'
  | 'no_journey_after_filters'
  | 'timeout';

export interface TflTransitJourneyResult {
  readonly minutes: number | null;
  readonly failureCode?: TflTransitFailureCode;
  readonly httpStatus?: number;
  /** `true` when a usable journey came from a **`nationalSearch=true`** call. */
  readonly nationalSearchUsed?: boolean;
  /** Second qualifying journey duration (minutes) when filters leave ≥2 options. */
  readonly alternativeJourneyMinutes?: number;
  /** Short user-facing hint when the chosen journey references disruption payloads. */
  readonly disruptionHint?: string;
}

interface CacheEntry {
  readonly storedAt: number;
  readonly result: TflTransitJourneyResult;
}

const journeyCache = new Map<string, CacheEntry>();

const roundCoord = (n: number): number => Math.round(n * 10_000) / 10_000;

const JOURNEY_PREF_QUERY: Record<
  NonNullable<TflTransitPlannerPreferences['journeyPreference']>,
  string
> = {
  least_time: 'LeastTime',
  least_interchange: 'LeastInterchange',
  least_walking: 'LeastWalking',
};

const RAIL_MODE_IDS = new Set([
  'tube',
  'dlr',
  'tram',
  'overground',
  'elizabeth-line',
  'tflrail',
  'national-rail',
]);

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const prefsKey = (p: TflTransitPlannerPreferences | undefined): string => {
  if (p === undefined) {
    return '{}';
  }
  return JSON.stringify({
    jp: p.journeyPreference ?? 'least_time',
    alt: p.includeAlternativeRoutes === true,
    avoid: [...(p.avoidLineIds ?? [])].map((s) => s.toLowerCase()).sort(),
    multi: p.requireMultipleJourneys === true,
    oneRail: p.atMostOneRailLeg === true,
    onePt: p.atMostOnePublicTransportLeg === true,
    date: p.dateYyyyMmDd ?? '',
    time: p.timeHhMm ?? '',
    dep: p.timeIsDeparting === true ? 'd' : p.timeIsDeparting === false ? 'a' : '',
    walk: p.maxWalkingMinutes ?? '',
    xfer: p.maxTransferMinutes ?? '',
    omitDef: p.omitDefaultPlannerDeparture === true,
    defDep:
      p.dateYyyyMmDd && p.timeHhMm
        ? `${p.dateYyyyMmDd}-${p.timeHhMm}-${p.timeIsDeparting === false ? 'a' : 'd'}`
        : 'auto',
  });
};

const mergeTflPlannerDeparturePrefs = (
  prefs: TflTransitPlannerPreferences | undefined,
  referenceMs: number,
): TflTransitPlannerPreferences | undefined => {
  if (prefs?.omitDefaultPlannerDeparture === true) {
    return prefs;
  }
  const d = prefs?.dateYyyyMmDd;
  const t = prefs?.timeHhMm;
  const hasBoth = d !== undefined && d !== '' && t !== undefined && t !== '';
  if (hasBoth) {
    return prefs;
  }
  const def = resolveDefaultLondonWeekdayMorningDeparture(referenceMs);
  return {
    ...prefs,
    journeyPreference: prefs?.journeyPreference,
    includeAlternativeRoutes: prefs?.includeAlternativeRoutes,
    avoidLineIds: prefs?.avoidLineIds,
    requireMultipleJourneys: prefs?.requireMultipleJourneys,
    atMostOneRailLeg: prefs?.atMostOneRailLeg,
    atMostOnePublicTransportLeg: prefs?.atMostOnePublicTransportLeg,
    maxWalkingMinutes: prefs?.maxWalkingMinutes,
    maxTransferMinutes: prefs?.maxTransferMinutes,
    omitDefaultPlannerDeparture: prefs?.omitDefaultPlannerDeparture,
    dateYyyyMmDd: def.dateYyyyMmDd,
    timeHhMm: def.timeHhMm,
    timeIsDeparting: prefs?.timeIsDeparting === false ? false : true,
  };
};

const cacheKey = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  prefs: TflTransitPlannerPreferences | undefined,
): string =>
  `${prefsKey(prefs)}|${String(roundCoord(fromLat))},${String(roundCoord(fromLng))}|${String(roundCoord(toLat))},${String(roundCoord(toLng))}`;

/** Clears the in-memory TfL journey cache (warm Lambda reuse only). For tests. */
export const clearTflJourneyCache = (): void => {
  journeyCache.clear();
};

const modeIdFromLeg = (leg: Record<string, unknown>): string => {
  const mode = leg.mode;
  if (typeof mode !== 'object' || mode === null) {
    return '';
  }
  const id = (mode as { id?: unknown }).id;
  return typeof id === 'string' ? id.toLowerCase() : '';
};

const collectLineIdsFromJourney = (journey: Record<string, unknown>): Set<string> => {
  const ids = new Set<string>();
  const legs = journey.legs;
  if (!Array.isArray(legs)) {
    return ids;
  }
  for (const leg of legs) {
    if (typeof leg !== 'object' || leg === null) {
      continue;
    }
    const l = leg as Record<string, unknown>;
    const routeOptions = l.routeOptions;
    if (Array.isArray(routeOptions)) {
      for (const ro of routeOptions) {
        if (typeof ro !== 'object' || ro === null) {
          continue;
        }
        const li = (ro as { lineIdentifier?: unknown }).lineIdentifier;
        if (
          typeof li === 'object' &&
          li !== null &&
          typeof (li as { id?: unknown }).id === 'string'
        ) {
          ids.add((li as { id: string }).id.toLowerCase());
        }
      }
    }
    const lineName = l.lineName;
    if (typeof lineName === 'string' && lineName.trim().length > 0) {
      ids.add(lineName.trim().toLowerCase().replace(/\s+/g, '-'));
    }
  }
  return ids;
};

const countRailLegs = (journey: Record<string, unknown>): number => {
  const legs = journey.legs;
  if (!Array.isArray(legs)) {
    return 0;
  }
  let n = 0;
  for (const leg of legs) {
    if (typeof leg !== 'object' || leg === null) {
      continue;
    }
    const id = modeIdFromLeg(leg as Record<string, unknown>);
    if (RAIL_MODE_IDS.has(id)) {
      n += 1;
    }
  }
  return n;
};

const countNonWalkingLegs = (journey: Record<string, unknown>): number => {
  const legs = journey.legs;
  if (!Array.isArray(legs)) {
    return 0;
  }
  let n = 0;
  for (const leg of legs) {
    if (typeof leg !== 'object' || leg === null) {
      continue;
    }
    const id = modeIdFromLeg(leg as Record<string, unknown>);
    if (id === '' || id === 'walking') {
      continue;
    }
    n += 1;
  }
  return n;
};

const journeyDurationMinutes = (journey: Record<string, unknown>): number | null => {
  const d = journey.duration;
  if (typeof d !== 'number' || !Number.isFinite(d) || d < 0) {
    return null;
  }
  return d / 60;
};

const legSignalsDisruption = (leg: Record<string, unknown>): boolean => {
  const a = leg.disruptions;
  if (Array.isArray(a) && a.length > 0) {
    return true;
  }
  const b = leg.disruption;
  if (Array.isArray(b) && b.length > 0) {
    return true;
  }
  return false;
};

const disruptionHintFromJourney = (journey: Record<string, unknown>): string | undefined => {
  const top = journey.disruptions;
  if (Array.isArray(top) && top.length > 0) {
    return 'TfL flagged disruptions on this journey; times may be less reliable.';
  }
  const legs = journey.legs;
  if (!Array.isArray(legs)) {
    return undefined;
  }
  for (const leg of legs) {
    if (
      typeof leg === 'object' &&
      leg !== null &&
      legSignalsDisruption(leg as Record<string, unknown>)
    ) {
      return 'TfL flagged disruption on at least one leg; times may be less reliable.';
    }
  }
  return undefined;
};

const parseJourneysRecords = (json: Record<string, unknown>): Record<string, unknown>[] => {
  const j = json.journeys;
  if (!Array.isArray(j)) {
    return [];
  }
  const out: Record<string, unknown>[] = [];
  for (const item of j) {
    if (typeof item === 'object' && item !== null) {
      out.push(item as Record<string, unknown>);
    }
  }
  return out;
};

interface JourneyPickOk {
  readonly minutes: number;
  readonly alternativeJourneyMinutes?: number;
  readonly disruptionHint?: string;
}

const selectJourney = (
  json: Record<string, unknown>,
  prefs: TflTransitPlannerPreferences | undefined,
): JourneyPickOk | { error: TflTransitFailureCode } => {
  const journeys = parseJourneysRecords(json);
  if (journeys.length === 0) {
    return { error: 'empty_journeys' };
  }

  const avoid = new Set(
    (prefs?.avoidLineIds ?? []).map((s) => s.toLowerCase().trim()).filter((s) => s.length > 0),
  );
  const needMulti = prefs?.requireMultipleJourneys === true;
  const oneRail = prefs?.atMostOneRailLeg === true;
  const onePt = prefs?.atMostOnePublicTransportLeg === true;

  const qualifying: Record<string, unknown>[] = [];
  for (const j of journeys) {
    if (avoid.size > 0) {
      const lineIds = collectLineIdsFromJourney(j);
      let usesAvoided = false;
      for (const a of avoid) {
        if (lineIds.has(a)) {
          usesAvoided = true;
          break;
        }
      }
      if (usesAvoided) {
        continue;
      }
    }
    if (oneRail && countRailLegs(j) > 1) {
      continue;
    }
    if (onePt && countNonWalkingLegs(j) > 1) {
      continue;
    }
    const mins = journeyDurationMinutes(j);
    if (mins === null) {
      continue;
    }
    qualifying.push(j);
  }

  if (qualifying.length === 0) {
    return { error: 'no_journey_after_filters' };
  }
  if (needMulti && qualifying.length < 2) {
    return { error: 'no_journey_after_filters' };
  }

  const first = qualifying[0];
  if (first === undefined) {
    return { error: 'invalid_payload' };
  }
  const mins = journeyDurationMinutes(first);
  if (mins === null) {
    return { error: 'invalid_payload' };
  }

  let alternativeJourneyMinutes: number | undefined;
  if (qualifying.length >= 2) {
    const second = qualifying[1];
    if (second !== undefined) {
      const m2 = journeyDurationMinutes(second);
      if (m2 !== null) {
        alternativeJourneyMinutes = m2;
      }
    }
  }

  return {
    minutes: mins,
    alternativeJourneyMinutes,
    disruptionHint: disruptionHintFromJourney(first),
  };
};

const shouldRetryHttpStatus = (status: number): boolean =>
  status === 429 || status === 502 || status === 503 || status === 504;

const buildJourneyUrl = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  creds: TflApiCredentials,
  nationalSearch: boolean,
  modes: string,
  prefs: TflTransitPlannerPreferences | undefined,
): URL => {
  const u = new URL(TFL_ORIGIN);
  u.pathname = `/Journey/JourneyResults/${String(fromLat)},${String(fromLng)}/to/${String(toLat)},${String(toLng)}`;
  u.searchParams.set('app_key', creds.appKey);
  const jpKey = prefs?.journeyPreference ?? 'least_time';
  u.searchParams.set('journeyPreference', JOURNEY_PREF_QUERY[jpKey]);
  // Timetable-oriented planning: do not ask for live platform/arrival overlay data.
  u.searchParams.set('useRealTimeLiveArrivals', 'false');
  u.searchParams.set('walkingSpeed', 'average');
  u.searchParams.set('mode', modes);
  if (prefs?.includeAlternativeRoutes === true) {
    u.searchParams.set('includeAlternativeRoutes', 'true');
  }
  if (nationalSearch) {
    u.searchParams.set('nationalSearch', 'true');
  }

  const d = prefs?.dateYyyyMmDd;
  const t = prefs?.timeHhMm;
  if (d !== undefined && d !== '' && t !== undefined && t !== '') {
    u.searchParams.set('date', d);
    u.searchParams.set('time', t);
    if (prefs?.timeIsDeparting === false) {
      u.searchParams.set('timeIs', 'Arriving');
    } else {
      u.searchParams.set('timeIs', 'Departing');
    }
  }

  const mw = prefs?.maxWalkingMinutes;
  if (typeof mw === 'number' && Number.isFinite(mw) && mw > 0) {
    u.searchParams.set('maxWalkingMinutes', String(Math.round(mw)));
  }
  const mx = prefs?.maxTransferMinutes;
  if (typeof mx === 'number' && Number.isFinite(mx) && mx > 0) {
    u.searchParams.set('maxTransferMinutes', String(Math.round(mx)));
  }

  return u;
};

const fetchTflJsonOnce = async (
  u: URL,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<
  | { ok: true; json: Record<string, unknown>; httpStatus: number }
  | { ok: false; reason: TflTransitFailureCode; httpStatus?: number }
> => {
  let res: Response;
  try {
    res = await fetchImpl(u.href, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { ok: false, reason: 'timeout' };
  }

  if (!res.ok) {
    return { ok: false, reason: 'http_error', httpStatus: res.status };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, reason: 'json_parse_error', httpStatus: res.status };
  }

  if (typeof json !== 'object' || json === null) {
    return { ok: false, reason: 'invalid_payload', httpStatus: res.status };
  }

  return { ok: true, json: json as Record<string, unknown>, httpStatus: res.status };
};

const fetchTflJsonWithRetries = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: TflApiCredentials,
  nationalSearch: boolean,
  modes: string,
  prefs: TflTransitPlannerPreferences | undefined,
  timeoutMs: number,
): Promise<
  | { ok: true; json: Record<string, unknown>; httpStatus: number }
  | { ok: false; reason: TflTransitFailureCode; httpStatus?: number }
> => {
  const u = buildJourneyUrl(fromLat, fromLng, toLat, toLng, creds, nationalSearch, modes, prefs);
  let r = await fetchTflJsonOnce(u, fetchImpl, timeoutMs);
  if (!r.ok && r.httpStatus !== undefined && shouldRetryHttpStatus(r.httpStatus)) {
    await delay(RATE_LIMIT_RETRY_MS);
    r = await fetchTflJsonOnce(u, fetchImpl, timeoutMs);
  }
  return r;
};

const outcomeFromJson = (
  json: Record<string, unknown>,
  prefs: TflTransitPlannerPreferences | undefined,
  nationalSearchUsed: boolean,
): TflTransitJourneyResult => {
  const picked = selectJourney(json, prefs);
  if ('error' in picked) {
    return { minutes: null, failureCode: picked.error };
  }
  return {
    minutes: picked.minutes,
    nationalSearchUsed,
    alternativeJourneyMinutes: picked.alternativeJourneyMinutes,
    disruptionHint: picked.disruptionHint,
  };
};

const fetchTflTransitJourneyUncached = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: TflApiCredentials,
  prefs: TflTransitPlannerPreferences | undefined,
  timeoutMs: number,
): Promise<TflTransitJourneyResult> => {
  const tryModes = async (
    nationalSearch: boolean,
    modes: string,
  ): Promise<TflTransitJourneyResult> => {
    const res = await fetchTflJsonWithRetries(
      fromLat,
      fromLng,
      toLat,
      toLng,
      fetchImpl,
      creds,
      nationalSearch,
      modes,
      prefs,
      timeoutMs,
    );
    if (!res.ok) {
      return {
        minutes: null,
        failureCode: res.reason,
        httpStatus: res.httpStatus,
      };
    }
    return outcomeFromJson(res.json, prefs, nationalSearch);
  };

  let r = await tryModes(false, MODES_WITH_NATIONAL_RAIL);
  if (r.minutes !== null) {
    return r;
  }
  if (r.failureCode === 'http_error' && r.httpStatus !== 429) {
    const fallback = await tryModes(false, MODES_WITHOUT_NATIONAL_RAIL);
    if (fallback.minutes !== null) {
      return fallback;
    }
    r = fallback;
  }
  if (r.failureCode !== 'empty_journeys') {
    return { ...r, nationalSearchUsed: false };
  }

  const nat = await tryModes(true, MODES_WITH_NATIONAL_RAIL);
  if (nat.minutes !== null) {
    return { ...nat, nationalSearchUsed: true };
  }
  if (nat.failureCode === 'http_error' && nat.httpStatus !== 429) {
    const natFb = await tryModes(true, MODES_WITHOUT_NATIONAL_RAIL);
    if (natFb.minutes !== null) {
      return { ...natFb, nationalSearchUsed: true };
    }
    return { ...natFb, nationalSearchUsed: false };
  }
  return { ...nat, nationalSearchUsed: false };
};

/**
 * Public-transit journey duration in **minutes** from TfL, with optional preferences and filters.
 * Retries: **429 / 502 / 503 / 504** once after a short delay; **empty journeys** then **`nationalSearch=true`**;
 * **http errors** once with modes **without national-rail** (in case the key/API rejects that mode).
 * **Successful** responses are cached (TTL + size cap); **failures are not** cached.
 */
export const fetchTflTransitJourney = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: TflApiCredentials,
  prefs?: TflTransitPlannerPreferences,
  timeoutMs = 10_000,
): Promise<TflTransitJourneyResult> => {
  const now = Date.now();
  const merged = mergeTflPlannerDeparturePrefs(prefs, now);
  const key = cacheKey(fromLat, fromLng, toLat, toLng, merged);
  const hit = journeyCache.get(key);
  if (
    hit !== undefined &&
    now - hit.storedAt < CACHE_TTL_SUCCESS_MS &&
    hit.result.minutes !== null
  ) {
    journeyCache.delete(key);
    journeyCache.set(key, hit);
    return hit.result;
  }

  const result = await fetchTflTransitJourneyUncached(
    fromLat,
    fromLng,
    toLat,
    toLng,
    fetchImpl,
    creds,
    merged,
    timeoutMs,
  );

  if (result.minutes !== null) {
    journeyCache.set(key, { storedAt: now, result });
    while (journeyCache.size > MAX_CACHE_ENTRIES) {
      const firstKey = journeyCache.keys().next().value;
      if (firstKey === undefined) {
        break;
      }
      journeyCache.delete(firstKey);
    }
  }

  return result;
};

/**
 * Backwards-compatible: minutes only (no failure detail).
 * @see https://api.tfl.gov.uk/ — register for an **app key** only.
 */
export const fetchTflTransitJourneyMinutes = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: TflApiCredentials,
  timeoutMs = 10_000,
): Promise<number | null> => {
  const r = await fetchTflTransitJourney(
    fromLat,
    fromLng,
    toLat,
    toLng,
    fetchImpl,
    creds,
    undefined,
    timeoutMs,
  );
  return r.minutes;
};
