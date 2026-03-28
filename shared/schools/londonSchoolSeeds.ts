import type { SchoolPhaseDto } from '../searchAreasContract';

/** Small illustrative set of school locations (not exhaustive). For discovery UX only. */
export interface LondonSchoolSeed {
  readonly latitude: number;
  readonly longitude: number;
  readonly phases: readonly SchoolPhaseDto[];
}

export const LONDON_SCHOOL_SEEDS: readonly LondonSchoolSeed[] = [
  { latitude: 51.5226, longitude: -0.1745, phases: ['primary'] },
  { latitude: 51.5133, longitude: -0.089, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.5014, longitude: -0.1797, phases: ['primary', 'secondary'] },
  { latitude: 51.5462, longitude: -0.0553, phases: ['primary', 'secondary', 'sixth_form'] },
  { latitude: 51.4743, longitude: -0.0765, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.4618, longitude: -0.1147, phases: ['primary'] },
  { latitude: 51.5489, longitude: -0.1023, phases: ['primary', 'secondary'] },
  { latitude: 51.5152, longitude: -0.1048, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.4926, longitude: -0.2234, phases: ['primary'] },
  { latitude: 51.4872, longitude: -0.3103, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.5765, longitude: -0.1458, phases: ['primary', 'secondary'] },
  { latitude: 51.6074, longitude: -0.0678, phases: ['primary'] },
  { latitude: 51.4526, longitude: -0.3019, phases: ['secondary', 'sixth_form'] },
  { latitude: 51.4051, longitude: -0.1277, phases: ['primary', 'secondary'] },
  { latitude: 51.5341, longitude: 0.0121, phases: ['primary', 'secondary', 'sixth_form'] },
  { latitude: 51.4781, longitude: -0.0077, phases: ['primary'] },
];
