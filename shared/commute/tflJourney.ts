import { resolveDefaultLondonWeekdayMorningDeparture } from './tflDefaultLondonDeparture';

const TFL_ORIGIN = 'https://api.tfl.gov.uk';

/** Journey `mode` query must use ids from `GET /Line/Meta/Modes` — `tflrail` is not valid (removed by TfL). */
const MODES_WITH_NATIONAL_RAIL =
  'tube,bus,dlr,tram,overground,elizabeth-line,national-rail,walking';
const MODES_WITHOUT_NATIONAL_RAIL = 'tube,bus,dlr,tram,overground,elizabeth-line,walking';

/** Backoff before retrying timeout or 5xx (not 429). */
const RETRY_DELAY_MS = 750;
/** TfL often returns 429 under burst load; wait longer before retries. */
const RETRY_DELAY_AFTER_429_MS = 2800;
/** Third attempt after **429** only (still 429 after second try). */
const RETRY_DELAY_AFTER_429_AGAIN_MS = 5200;
/** Default when `TFL_JOURNEY_CACHE_TTL_MS` unset: timetable-style results change slowly vs search latency. */
const DEFAULT_CACHE_TTL_SUCCESS_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2500;

const parseTflJourneyCacheTtlMs = (): number => {
  const raw = process.env.TFL_JOURNEY_CACHE_TTL_MS?.trim();
  if (raw === undefined || raw === '') {
    return DEFAULT_CACHE_TTL_SUCCESS_MS;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_CACHE_TTL_SUCCESS_MS;
  }
  if (n === 0) {
    return 0;
  }
  const min = 60 * 1000;
  const max = 24 * 60 * 60 * 1000;
  return Math.min(max, Math.max(min, n));
};

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
  /** Journeys returned by TfL before client-side filters (avoid lines, leg limits, etc.). */
  readonly tflRawJourneyCount?: number;
  /** Journeys passing filters; on failure often **0** or **1** when “need two routes” blocked. */
  readonly tflQualifyingJourneyCount?: number;
  readonly failureCode?: TflTransitFailureCode;
  readonly httpStatus?: number;
  /** Sanitized first line of TfL’s response body when `failureCode` is `http_error` (debugging). */
  readonly tflHttpErrorBody?: string;
  /** `true` when a usable journey came from a **`nationalSearch=true`** call. */
  readonly nationalSearchUsed?: boolean;
  /** Second qualifying journey duration (minutes) when filters leave ≥2 options. */
  readonly alternativeJourneyMinutes?: number;
  /** Short user-facing hint when the chosen journey references disruption payloads. */
  readonly disruptionHint?: string;
  /** How {@link minutes} was derived from TfL’s ranked journey list. */
  readonly durationMethod?: 'median-first-three-qualifying';
  /**
   * Human-readable chain of legs from the **first** qualifying journey (same filters as scoring).
   * Not a turn-by-turn list; for discovery only.
   */
  readonly routeSummary?: string;
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

/** Leg `mode.id` values that count as rail-like (includes legacy `tflrail` from older payloads). */
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

/** Exported for commute summary copy (same merge as Journey Planner requests). */
export const mergeTflPlannerDeparturePrefs = (
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

/**
 * Prefer wall-clock span from TfL’s journey timestamps when present. Live Journey Planner
 * responses include `startDateTime` and `arrivalDateTime`; those match the route summary users
 * see. The numeric `duration` field is not consistently documented as seconds vs minutes in
 * Swagger — using timestamps avoids mis-scaling (e.g. ~90 min commutes showing as ~1.5 min).
 */
const journeyDurationMinutesFromDateTimes = (journey: Record<string, unknown>): number | null => {
  const start = journey.startDateTime;
  const end = journey.arrivalDateTime;
  if (typeof start !== 'string' || typeof end !== 'string') {
    return null;
  }
  const t0 = Date.parse(start);
  const t1 = Date.parse(end);
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 < t0) {
    return null;
  }
  return (t1 - t0) / 60000;
};

const journeyDurationMinutes = (journey: Record<string, unknown>): number | null => {
  const fromWallClock = journeyDurationMinutesFromDateTimes(journey);
  if (fromWallClock !== null) {
    return fromWallClock;
  }
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
  readonly routeSummary?: string;
  readonly rawJourneyCount: number;
  readonly qualifyingJourneyCount: number;
}

interface JourneyPickErr {
  readonly error: TflTransitFailureCode;
  readonly rawJourneyCount: number;
  readonly qualifyingJourneyCount: number;
}

const MAX_ROUTE_SUMMARY_CHARS = 480;

const summarizeTflLeg = (leg: Record<string, unknown>): string => {
  const mode = leg.mode;
  let modeLabel = '';
  if (typeof mode === 'object' && mode !== null) {
    const name = (mode as { name?: unknown }).name;
    const id = (mode as { id?: unknown }).id;
    if (typeof name === 'string' && name.trim().length > 0) {
      modeLabel = name.trim();
    } else if (typeof id === 'string' && id.trim().length > 0) {
      modeLabel = id.trim();
    }
  }
  const instruction = leg.instruction;
  let summary = '';
  if (typeof instruction === 'object' && instruction !== null) {
    const sm = (instruction as { summary?: unknown }).summary;
    if (typeof sm === 'string' && sm.trim().length > 0) {
      summary = sm.trim();
    }
  }
  if (summary.length > 0) {
    return modeLabel.length > 0 ? `${modeLabel}: ${summary}` : summary;
  }
  const routeOptions = leg.routeOptions;
  if (Array.isArray(routeOptions) && routeOptions.length > 0) {
    const ro: unknown = routeOptions[0];
    if (typeof ro === 'object' && ro !== null) {
      const rn = (ro as { name?: unknown }).name;
      if (typeof rn === 'string' && rn.trim().length > 0) {
        return modeLabel.length > 0 ? `${modeLabel} (${rn.trim()})` : rn.trim();
      }
    }
  }
  return modeLabel.length > 0 ? modeLabel : 'Leg';
};

/** One-line summary of legs for UI (first journey only). */
export const summarizeJourneyRoute = (journey: Record<string, unknown>): string => {
  const legs = journey.legs;
  if (!Array.isArray(legs) || legs.length === 0) {
    return '';
  }
  const parts: string[] = [];
  for (const leg of legs) {
    if (typeof leg !== 'object' || leg === null) {
      continue;
    }
    const s = summarizeTflLeg(leg as Record<string, unknown>);
    if (s.length > 0) {
      parts.push(s);
    }
  }
  const joined = parts.join(' → ');
  return joined.length > MAX_ROUTE_SUMMARY_CHARS
    ? `${joined.slice(0, MAX_ROUTE_SUMMARY_CHARS - 1)}…`
    : joined;
};

const medianMinutes = (values: readonly number[]): number => {
  if (values.length === 0) {
    return NaN;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    const v = sorted[mid];
    return v ?? NaN;
  }
  const lo = sorted[mid - 1];
  const hi = sorted[mid];
  if (lo === undefined || hi === undefined) {
    return NaN;
  }
  return (lo + hi) / 2;
};

const selectJourney = (
  json: Record<string, unknown>,
  prefs: TflTransitPlannerPreferences | undefined,
): JourneyPickOk | JourneyPickErr => {
  const journeys = parseJourneysRecords(json);
  const rawJourneyCount = journeys.length;
  if (journeys.length === 0) {
    return { error: 'empty_journeys', rawJourneyCount: 0, qualifyingJourneyCount: 0 };
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
    return {
      error: 'no_journey_after_filters',
      rawJourneyCount,
      qualifyingJourneyCount: 0,
    };
  }
  if (needMulti && qualifying.length < 2) {
    return {
      error: 'no_journey_after_filters',
      rawJourneyCount,
      qualifyingJourneyCount: qualifying.length,
    };
  }

  const aggregateSlice = qualifying.slice(0, Math.min(3, qualifying.length));
  const durations: number[] = [];
  for (const j of aggregateSlice) {
    const m = journeyDurationMinutes(j);
    if (m !== null) {
      durations.push(m);
    }
  }
  if (durations.length === 0) {
    return {
      error: 'invalid_payload',
      rawJourneyCount,
      qualifyingJourneyCount: qualifying.length,
    };
  }
  const mins = medianMinutes(durations);
  if (!Number.isFinite(mins)) {
    return {
      error: 'invalid_payload',
      rawJourneyCount,
      qualifyingJourneyCount: qualifying.length,
    };
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

  let disruptionHint: string | undefined;
  for (const j of aggregateSlice) {
    const h = disruptionHintFromJourney(j);
    if (h !== undefined) {
      disruptionHint = h;
      break;
    }
  }

  const primary = qualifying[0];
  const routeSummary = primary !== undefined ? summarizeJourneyRoute(primary) : undefined;

  return {
    minutes: mins,
    alternativeJourneyMinutes,
    disruptionHint,
    rawJourneyCount,
    qualifyingJourneyCount: qualifying.length,
    ...(routeSummary !== undefined && routeSummary.length > 0 ? { routeSummary } : {}),
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
  | {
      ok: false;
      reason: TflTransitFailureCode;
      httpStatus?: number;
      errorBodySnippet?: string;
    }
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
    let errorBodySnippet: string | undefined;
    try {
      const t = await res.text();
      const flat = t.replace(/\s+/g, ' ').trim();
      if (flat.length > 0) {
        errorBodySnippet = flat.length > 200 ? `${flat.slice(0, 197)}…` : flat;
      }
    } catch {
      // ignore
    }
    return { ok: false, reason: 'http_error', httpStatus: res.status, errorBodySnippet };
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
  | {
      ok: false;
      reason: TflTransitFailureCode;
      httpStatus?: number;
      errorBodySnippet?: string;
    }
> => {
  const u = buildJourneyUrl(fromLat, fromLng, toLat, toLng, creds, nationalSearch, modes, prefs);
  let r = await fetchTflJsonOnce(u, fetchImpl, timeoutMs);
  if (!r.ok) {
    const retriable =
      r.reason === 'timeout' || (r.httpStatus !== undefined && shouldRetryHttpStatus(r.httpStatus));
    if (retriable) {
      const waitMs = r.httpStatus === 429 ? RETRY_DELAY_AFTER_429_MS : RETRY_DELAY_MS;
      await delay(waitMs);
      r = await fetchTflJsonOnce(u, fetchImpl, timeoutMs);
    }
  }
  if (!r.ok && r.httpStatus === 429) {
    await delay(RETRY_DELAY_AFTER_429_AGAIN_MS);
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
    return {
      minutes: null,
      failureCode: picked.error,
      tflRawJourneyCount: picked.rawJourneyCount,
      tflQualifyingJourneyCount: picked.qualifyingJourneyCount,
    };
  }
  return {
    minutes: picked.minutes,
    nationalSearchUsed,
    alternativeJourneyMinutes: picked.alternativeJourneyMinutes,
    disruptionHint: picked.disruptionHint,
    durationMethod: 'median-first-three-qualifying',
    tflRawJourneyCount: picked.rawJourneyCount,
    tflQualifyingJourneyCount: picked.qualifyingJourneyCount,
    ...(picked.routeSummary !== undefined ? { routeSummary: picked.routeSummary } : {}),
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
      const snippet = res.errorBodySnippet;
      if (res.reason === 'http_error') {
        const st =
          typeof res.httpStatus === 'number' && Number.isFinite(res.httpStatus)
            ? res.httpStatus
            : -1;
        return {
          minutes: null,
          failureCode: 'http_error',
          httpStatus: st,
          ...(snippet !== undefined ? { tflHttpErrorBody: snippet } : {}),
        };
      }
      return {
        minutes: null,
        failureCode: res.reason,
        ...(res.httpStatus !== undefined ? { httpStatus: res.httpStatus } : {}),
        ...(snippet !== undefined ? { tflHttpErrorBody: snippet } : {}),
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
  const shouldTryNationalSearch =
    r.failureCode === 'empty_journeys' || r.failureCode === 'no_journey_after_filters';
  if (!shouldTryNationalSearch) {
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
 * Retries: **timeout** or **429 / 502 / 503 / 504** — first retry after a short delay (**longer** after **429**);
 * if still **429**, a **third** attempt after a longer wait. **`nationalSearch=true`** when the first
 * response has **empty journeys** or **no_journey_after_filters** (journeys present but all excluded by
 * client-side filters such as `requireMultipleJourneys` — national search often surfaces more options,
 * e.g. longer rail commutes into London);
 * **http errors** (non-429) may retry with modes **without national-rail** (in case the key/API rejects that mode).
 * **Successful** responses (usable journey minutes) are cached (**TTL** + size cap; default **15 min**,
 * override **`TFL_JOURNEY_CACHE_TTL_MS`**; **`0`** disables). **Failures** are not cached.
 */
export const fetchTflTransitJourney = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  fetchImpl: typeof fetch,
  creds: TflApiCredentials,
  prefs?: TflTransitPlannerPreferences,
  timeoutMs = 15_000,
): Promise<TflTransitJourneyResult> => {
  const now = Date.now();
  const cacheTtlMs = parseTflJourneyCacheTtlMs();
  const merged = mergeTflPlannerDeparturePrefs(prefs, now);
  const key = cacheKey(fromLat, fromLng, toLat, toLng, merged);
  const hit = journeyCache.get(key);
  if (
    cacheTtlMs > 0 &&
    hit !== undefined &&
    now - hit.storedAt < cacheTtlMs &&
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

  if (cacheTtlMs > 0 && result.minutes !== null) {
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
  timeoutMs = 15_000,
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
