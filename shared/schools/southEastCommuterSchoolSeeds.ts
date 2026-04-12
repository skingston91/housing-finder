import type { LondonSchoolSeed } from './londonSchoolSeeds';

/**
 * Illustrative school-location seeds outside the GLA so distance/performance scoring isn’t
 * dominated by far-away London points. Discovery only — not exhaustive.
 */
export const SOUTH_EAST_COMMUTER_SCHOOL_SEEDS: readonly LondonSchoolSeed[] = [
  {
    latitude: 50.8379,
    longitude: -0.1381,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 82, secondary: 76 },
  },
  {
    latitude: 51.4563,
    longitude: -0.9712,
    phases: ['primary', 'secondary', 'sixth_form'],
    performanceByPhase: { primary: 85, secondary: 78, sixth_form: 72 },
  },
  {
    latitude: 51.2401,
    longitude: -0.5664,
    phases: ['secondary', 'sixth_form'],
    performanceByPhase: { secondary: 80, sixth_form: 76 },
  },
  {
    latitude: 51.1132,
    longitude: -0.1831,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 80, secondary: 74 },
  },
  {
    latitude: 51.7324,
    longitude: 0.4697,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 83, secondary: 77 },
  },
  {
    latitude: 51.2755,
    longitude: 0.5234,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 81, secondary: 75 },
  },
  {
    latitude: 51.2827,
    longitude: 1.0756,
    phases: ['secondary', 'sixth_form'],
    performanceByPhase: { secondary: 79, sixth_form: 73 },
  },
  {
    latitude: 51.5868,
    longitude: 0.4776,
    phases: ['primary'],
    performanceByPhase: { primary: 78 },
  },
  {
    latitude: 50.7745,
    longitude: 0.2985,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 79, secondary: 73 },
  },
  {
    latitude: 50.8148,
    longitude: -0.3724,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 80, secondary: 74 },
  },
  {
    latitude: 51.4796,
    longitude: -0.5954,
    phases: ['primary', 'secondary', 'sixth_form'],
    performanceByPhase: { primary: 84, secondary: 79, sixth_form: 74 },
  },
  {
    latitude: 51.8927,
    longitude: 0.893,
    phases: ['secondary', 'sixth_form'],
    performanceByPhase: { secondary: 77, sixth_form: 71 },
  },
];
