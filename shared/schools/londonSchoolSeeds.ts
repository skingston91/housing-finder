import type { SchoolPhaseDto } from '../searchAreasContract';

/** Small illustrative set of school locations (not exhaustive). For discovery UX only. */
export interface LondonSchoolSeed {
  readonly latitude: number;
  readonly longitude: number;
  /** Unique reference number when known (GIAS / DfE); used to join official performance CSVs. */
  readonly urn?: string;
  readonly phases: readonly SchoolPhaseDto[];
  /**
   * Optional performance signal per phase (0–100): prototype seed metadata and/or values merged from
   * `LONDON_SCHOOL_PERFORMANCE_BY_URN` after DfE CSV ingest.
   */
  readonly performanceByPhase?: Partial<Record<SchoolPhaseDto, number>>;
}

export const LONDON_SCHOOL_SEEDS: readonly LondonSchoolSeed[] = [
  {
    latitude: 51.5226,
    longitude: -0.1745,
    phases: ['primary'],
    performanceByPhase: { primary: 95 },
  },
  {
    latitude: 51.5133,
    longitude: -0.089,
    phases: ['secondary', 'sixth_form'],
    performanceByPhase: { secondary: 80, sixth_form: 75 },
  },
  {
    latitude: 51.5014,
    longitude: -0.1797,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 88, secondary: 78 },
  },
  {
    latitude: 51.5462,
    longitude: -0.0553,
    phases: ['primary', 'secondary', 'sixth_form'],
    performanceByPhase: { primary: 90, secondary: 80, sixth_form: 78 },
  },
  {
    latitude: 51.4743,
    longitude: -0.0765,
    phases: ['secondary', 'sixth_form'],
    performanceByPhase: { secondary: 75, sixth_form: 70 },
  },
  {
    latitude: 51.4618,
    longitude: -0.1147,
    phases: ['primary'],
    performanceByPhase: { primary: 82 },
  },
  {
    latitude: 51.5489,
    longitude: -0.1023,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 88, secondary: 85 },
  },
  {
    latitude: 51.5152,
    longitude: -0.1048,
    phases: ['secondary', 'sixth_form'],
    performanceByPhase: { secondary: 78, sixth_form: 72 },
  },
  {
    latitude: 51.4926,
    longitude: -0.2234,
    phases: ['primary'],
    performanceByPhase: { primary: 80 },
  },
  {
    latitude: 51.4872,
    longitude: -0.3103,
    phases: ['secondary', 'sixth_form'],
    performanceByPhase: { secondary: 77, sixth_form: 74 },
  },
  {
    latitude: 51.5765,
    longitude: -0.1458,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 85, secondary: 83 },
  },
  {
    latitude: 51.6074,
    longitude: -0.0678,
    phases: ['primary'],
    performanceByPhase: { primary: 86 },
  },
  {
    latitude: 51.4526,
    longitude: -0.3019,
    phases: ['secondary', 'sixth_form'],
    performanceByPhase: { secondary: 79, sixth_form: 73 },
  },
  {
    latitude: 51.4051,
    longitude: -0.1277,
    phases: ['primary', 'secondary'],
    performanceByPhase: { primary: 90, secondary: 84 },
  },
  {
    latitude: 51.5341,
    longitude: 0.0121,
    phases: ['primary', 'secondary', 'sixth_form'],
    performanceByPhase: { primary: 92, secondary: 86, sixth_form: 84 },
  },
  {
    latitude: 51.4781,
    longitude: -0.0077,
    phases: ['primary'],
    performanceByPhase: { primary: 84 },
  },
];
