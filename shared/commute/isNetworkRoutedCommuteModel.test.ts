import { describe, expect, it } from 'vitest';

import { isNetworkRoutedCommuteModel } from './isNetworkRoutedCommuteModel';

describe('isNetworkRoutedCommuteModel', () => {
  it('is true only for TfL and ORS directions models', () => {
    expect(isNetworkRoutedCommuteModel('tfl-unified-api')).toBe(true);
    expect(isNetworkRoutedCommuteModel('openrouteservice-directions')).toBe(true);
    expect(isNetworkRoutedCommuteModel('tfl-fallback-straight-line')).toBe(false);
    expect(isNetworkRoutedCommuteModel('openrouteservice-fallback-straight-line')).toBe(false);
    expect(isNetworkRoutedCommuteModel('straight-line-time-estimate')).toBe(false);
  });
});
