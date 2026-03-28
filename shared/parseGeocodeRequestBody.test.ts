import { describe, expect, it } from 'vitest';

import { parseGeocodeRequestBody } from './parseGeocodeRequestBody';

describe('parseGeocodeRequestBody', () => {
  it('accepts trimmed q', () => {
    const r = parseGeocodeRequestBody({ q: '  Old Street  ' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.q).toBe('Old Street');
    }
  });

  it('rejects short q', () => {
    const r = parseGeocodeRequestBody({ q: 'x' });
    expect(r.ok).toBe(false);
  });
});
