import { describe, expect, it } from 'vitest';

import { commuteModelDisplayLabel } from './commuteModelLabels';

describe('commuteModelDisplayLabel', () => {
  it('maps known contract ids to readable labels', () => {
    expect(commuteModelDisplayLabel('tfl-unified-api')).toContain('TfL');
    expect(commuteModelDisplayLabel('straight-line-time-estimate')).toContain('Straight-line');
  });

  it('passes through unknown ids', () => {
    expect(commuteModelDisplayLabel('future-model')).toBe('future-model');
  });
});
