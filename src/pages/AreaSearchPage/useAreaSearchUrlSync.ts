import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { SetURLSearchParams } from 'react-router';

import type { AreaSearchFormState } from './buildSearchAreasRequest';
import { defaultFormState } from './buildSearchAreasRequest';
import {
  areaSearchFormsEncodeToSameQueryParam,
  decodeAreaSearchQueryParam,
  encodeAreaSearchQueryParam,
  MAX_AREA_SEARCH_Q_CHARS,
} from './areaSearchUrlState';

const DEBOUNCE_MS = 450;

function logSetSearchParamsFailure(err: unknown): void {
  if (import.meta.env.DEV) {
    console.warn('[AreaSearch] setSearchParams failed (URL may be unchanged)', err);
  }
}

/**
 * Keeps `?q=` in sync with {@link AreaSearchFormState}: debounced writes on form change,
 * and re-hydrates the form when `searchParams` change (back/forward, manual edit).
 */
export function useAreaSearchUrlSync(
  form: AreaSearchFormState,
  setForm: Dispatch<SetStateAction<AreaSearchFormState>>,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
): {
  readonly urlMessage: string | null;
  readonly resetSearchUrlBar: () => void;
} {
  const skipUrlSyncRef = useRef(true);
  const defaultEncodedRef = useRef<string | null>(null);
  defaultEncodedRef.current ??= encodeAreaSearchQueryParam(defaultFormState());

  const [urlMessage, setUrlMessage] = useState<string | null>(null);

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    const currentQ = searchParams.get('q');
    const encoded = encodeAreaSearchQueryParam(form);
    if (currentQ === null && encoded === defaultEncodedRef.current) {
      return;
    }
    if (currentQ === encoded) {
      return;
    }
    const h = window.setTimeout(() => {
      try {
        setSearchParams({ q: encoded }, { replace: false });
      } catch (err) {
        logSetSearchParamsFailure(err);
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(h);
    };
  }, [form, searchParams, setSearchParams]);

  useEffect(() => {
    const q = searchParams.get('q');
    const def = defaultFormState();

    if (!q || q.length === 0) {
      if (areaSearchFormsEncodeToSameQueryParam(form, def)) {
        return;
      }
      setForm(def);
      setUrlMessage('You’re back to the default search settings.');
      return;
    }
    if (q.length > MAX_AREA_SEARCH_Q_CHARS) {
      setForm((prev) => {
        const d = defaultFormState();
        return areaSearchFormsEncodeToSameQueryParam(prev, d) ? prev : d;
      });
      setUrlMessage(
        "This link's search settings were too large to load, so we started from the default search.",
      );
      setSearchParams({}, { replace: true });
      return;
    }
    const decoded = decodeAreaSearchQueryParam(q);
    if (decoded === null) {
      setForm((prev) => {
        const d = defaultFormState();
        return areaSearchFormsEncodeToSameQueryParam(prev, d) ? prev : d;
      });
      setUrlMessage(
        'We couldn’t read the search settings from your link, so we started from the default search.',
      );
      setSearchParams({}, { replace: true });
      return;
    }
    if (areaSearchFormsEncodeToSameQueryParam(form, decoded)) {
      setUrlMessage(null);
      return;
    }
    setUrlMessage(null);
    setForm(decoded);
  }, [form, searchParams, setForm, setSearchParams]);

  const resetSearchUrlBar = useCallback(() => {
    setUrlMessage('You’re back to the default search settings.');
    setSearchParams({}, { replace: false });
  }, [setSearchParams]);

  return { urlMessage, resetSearchUrlBar };
}
