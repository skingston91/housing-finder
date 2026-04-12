import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

process.env.TFL_JOURNEY_MIN_INTERVAL_MS = '0';

afterEach(() => {
  cleanup();
});
