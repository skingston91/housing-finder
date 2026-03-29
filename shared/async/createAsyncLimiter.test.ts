import { describe, expect, it } from 'vitest';

import { createAsyncLimiter } from './createAsyncLimiter';

describe('createAsyncLimiter', () => {
  it('runs at most N tasks concurrently', async () => {
    const limit = createAsyncLimiter(2);
    let concurrent = 0;
    let maxConcurrent = 0;
    const task = async (): Promise<void> => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise<void>((r) => setTimeout(r, 5));
      concurrent--;
    };
    await Promise.all([limit(task), limit(task), limit(task), limit(task)]);
    expect(maxConcurrent).toBe(2);
  });
});
