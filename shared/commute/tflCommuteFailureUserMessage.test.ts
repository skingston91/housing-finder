import { describe, expect, it } from 'vitest';

import { describeTflHttpFailureAdvice } from './tflCommuteFailureUserMessage';

describe('describeTflHttpFailureAdvice', () => {
  it('prioritises invalid key when TfL body says so (even on 429)', () => {
    const s = describeTflHttpFailureAdvice(429, 'Invalid app_key is provided.');
    expect(s).toMatch(/invalid/i);
    expect(s).toMatch(/429/);
    expect(s).toMatch(/not only/i);
  });

  it('explains 429 without blaming rate limits only when body is empty', () => {
    const s = describeTflHttpFailureAdvice(429, '');
    expect(s).toMatch(/429/);
    expect(s).toMatch(/invalid/i);
  });

  it('uses generic line for other statuses', () => {
    expect(describeTflHttpFailureAdvice(503, '')).toMatch(/503/);
  });

  it('handles unknown status sentinel', () => {
    expect(describeTflHttpFailureAdvice(-1, '')).toMatch(/not available to the app/);
  });
});
