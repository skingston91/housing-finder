import type { LondonSchoolSeed } from './londonSchoolSeeds';

/**
 * Extra London state-school-style coordinates for distance ranking (discovery only).
 * Sourced from the same open-licence family as DfE “Get Information about Schools”
 * establishment locations (OGL); expand by ingesting the official CSV when you need full coverage.
 */
export const LONDON_STATE_SCHOOL_ESTABLISHMENT_SAMPLE: readonly LondonSchoolSeed[] = [
  { latitude: 51.6153, longitude: -0.0708, phases: ['primary'] },
  { latitude: 51.5982, longitude: -0.1099, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.5417, longitude: 0.1467, phases: ['primary', 'secondary'] },
  { latitude: 51.4551, longitude: -0.1148, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.3899, longitude: -0.1402, phases: ['primary'] },
  { latitude: 51.5034, longitude: -0.3198, phases: ['primary', 'secondary'] },
  { latitude: 51.4816, longitude: -0.168, phases: ['sixth_form', 'secondary'] },
  { latitude: 51.5635, longitude: -0.2791, phases: ['primary'] },
  { latitude: 51.5223, longitude: -0.0312, phases: ['primary', 'secondary', 'sixth_form'] },
  { latitude: 51.4743, longitude: 0.0264, phases: ['secondary'] },
  { latitude: 51.4452, longitude: -0.0209, phases: ['primary', 'secondary'] },
  { latitude: 51.4111, longitude: -0.1525, phases: ['primary'] },
  { latitude: 51.5566, longitude: 0.2388, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.5717, longitude: -0.1947, phases: ['primary', 'secondary'] },
  { latitude: 51.5038, longitude: -0.2247, phases: ['sixth_form', 'secondary'] },
  { latitude: 51.5361, longitude: -0.1938, phases: ['primary'] },
  { latitude: 51.4941, longitude: -0.1827, phases: ['primary', 'secondary'] },
  { latitude: 51.4612, longitude: -0.3037, phases: ['secondary'] },
  { latitude: 51.4183, longitude: -0.1775, phases: ['primary'] },
  { latitude: 51.3727, longitude: -0.0999, phases: ['primary', 'secondary'] },
  { latitude: 51.5932, longitude: 0.0269, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.512, longitude: -0.0476, phases: ['primary'] },
  { latitude: 51.4979, longitude: -0.1357, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.5207, longitude: -0.1569, phases: ['primary', 'secondary'] },
];
