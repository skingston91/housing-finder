import { afterEach, describe, expect, it } from 'vitest';

import { isSamLocalLambda } from './isSamLocalLambda';

describe('isSamLocalLambda', () => {
  const prev = process.env.AWS_SAM_LOCAL;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.AWS_SAM_LOCAL;
    } else {
      process.env.AWS_SAM_LOCAL = prev;
    }
  });

  it('is true when AWS_SAM_LOCAL is the string SAM sets', () => {
    process.env.AWS_SAM_LOCAL = 'true';
    expect(isSamLocalLambda()).toBe(true);
  });

  it('is false when unset (real Lambda or tests)', () => {
    delete process.env.AWS_SAM_LOCAL;
    expect(isSamLocalLambda()).toBe(false);
  });
});
