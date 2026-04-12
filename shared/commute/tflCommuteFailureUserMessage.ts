/**
 * Short user-facing line for TfL Journey Planner HTTP failures (transit fallback).
 * TfL may use HTTP 429 for invalid keys as well as rate limits — use {@link errorBody} when present.
 */
export const describeTflHttpFailureAdvice = (httpStatus: number, errorBody?: string): string => {
  if (httpStatus === -1) {
    return 'TfL returned a non-success HTTP response (status not available to the app). Check TFL_APP_KEY, network, and service status.';
  }
  const b = (errorBody ?? '').trim().toLowerCase();
  if (b.includes('invalid') && b.includes('app_key')) {
    return `TfL says the app key is invalid — set TFL_APP_KEY on the search Lambda from the TfL API portal. (HTTP ${String(httpStatus)}; invalid keys often get this code, not only “too many requests”.)`;
  }
  if (httpStatus === 429) {
    return 'TfL returned HTTP 429 (rate limit or quota). If the key is invalid, TfL may also use 429 — check TFL_APP_KEY and the response text below.';
  }
  return `TfL returned HTTP ${String(httpStatus)}. Check TFL_APP_KEY, rate limits, and service status.`;
};
