import { isSamLocalLambda } from '../runtime/isSamLocalLambda';

/**
 * Deployed Lambdas always require API keys for the commute mode in use (no silent straight-line fallback).
 * SAM local uses `SEARCH_AREAS_ROUTING_STRICT` (`1` = enforce; `0` = allow fallback with console warnings).
 */
export const resolveSearchAreasRoutingStrict = (): boolean => {
  if (!isSamLocalLambda()) {
    return true;
  }
  return process.env.SEARCH_AREAS_ROUTING_STRICT?.trim() === '1';
};
