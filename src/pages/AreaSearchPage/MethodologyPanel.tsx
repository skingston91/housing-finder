import { Alert, Box, Stack, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';

import {
  firstAffordabilityDiscoveryHint,
  firstCrimeDataPartialNote,
  firstCrimeDataUnavailableNote,
  firstDataPoliceUkAttribution,
  firstFutureTransportMethodologyNote,
  firstLandRegistryOglAttribution,
  firstSchoolsCoverageHint,
  firstSchoolsDataAttribution,
  firstSchoolsPerformanceYearHint,
  firstSizeFitMethodologyNote,
} from './searchResultsAttribution';

import { SIZE_FIT_SUMMARY_WHEN_ACTIVE } from './sizeFitUserContext';
import { isSizeFitSecondScoreActive } from './sizeFitSearchActive';

/** When DfE URN performance is on but few establishment points join, warn clearly. */
export const LOW_SCHOOLS_COVERAGE_THRESHOLD_PCT = 50;

const shouldWarnLowSchoolsCoverage = (areas: readonly RankedArea[]): boolean => {
  const m = areas[0]?.metadata;
  if (m === undefined) {
    return false;
  }
  if (m.schoolsModel !== 'gias-open-data-sample-dfe-performance-urn-map') {
    return false;
  }
  const withUrn = m.schoolsPointsWithUrn;
  const cov = m.schoolsPerformanceCoveragePct;
  if (typeof withUrn !== 'number' || !Number.isFinite(withUrn) || withUrn <= 0) {
    return false;
  }
  if (typeof cov !== 'number' || !Number.isFinite(cov)) {
    return false;
  }
  return cov < LOW_SCHOOLS_COVERAGE_THRESHOLD_PCT;
};

export const MethodologyPanel = ({ areas }: { areas: readonly RankedArea[] }) => {
  const policeUk = firstDataPoliceUkAttribution(areas);
  const landRegistry = firstLandRegistryOglAttribution(areas);
  const schools = firstSchoolsDataAttribution(areas);
  const schoolsCoverage = firstSchoolsCoverageHint(areas);
  const schoolsYear = firstSchoolsPerformanceYearHint(areas);
  const affordabilityHonesty = firstAffordabilityDiscoveryHint(areas);
  const futureTransport = firstFutureTransportMethodologyNote(areas);
  const sizeFit = firstSizeFitMethodologyNote(areas);
  const crimeMissing = firstCrimeDataUnavailableNote(areas);
  const crimePartial = firstCrimeDataPartialNote(areas);
  const sizeFitActive = areas.some((a) => isSizeFitSecondScoreActive(a.metadata));
  const lowCoverage = shouldWarnLowSchoolsCoverage(areas);
  const hasBody =
    policeUk !== undefined ||
    landRegistry !== undefined ||
    schools !== undefined ||
    schoolsCoverage !== undefined ||
    schoolsYear !== undefined ||
    affordabilityHonesty !== undefined ||
    futureTransport !== undefined ||
    sizeFit !== undefined ||
    crimeMissing !== undefined ||
    crimePartial !== undefined;

  return (
    <Stack gap={3}>
      {lowCoverage ? (
        <Alert.Root status="warning" variant="subtle">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Lower schools data match rate</Alert.Title>
            <Alert.Description fontSize="sm">
              DfE performance is joined by school URN, but fewer than{' '}
              {String(LOW_SCHOOLS_COVERAGE_THRESHOLD_PCT)}% of URN-labelled sample points matched.
              The schools score may lean on distance. Check coverage in the methodology section or
              refresh ingest when you have updated CSVs.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}
      <Text fontSize="sm" color="fg.muted">
        Scores blend affordability, commute, schools, and crime; you can optionally include{' '}
        <Text as="span" fontWeight="medium">
          price momentum
        </Text>{' '}
        (UK HPI year-on-year change by borough, scaled relative to candidates in this search—not a
        forecast). Indicative only—not admissions, catchment, or purchase advice.
        {sizeFitActive ? ` ${SIZE_FIT_SUMMARY_WHEN_ACTIVE}` : ''}
      </Text>
      {hasBody ? (
        <Box as="details" borderWidth="1px" borderColor="gray.200" rounded="lg" p={3} bg="white">
          <Box
            as="summary"
            cursor="pointer"
            fontWeight="medium"
            fontSize="sm"
            color="fg.muted"
            _hover={{ color: 'fg' }}
          >
            Data sources and methodology
          </Box>
          <Stack gap={2} mt={3} fontSize="sm">
            {affordabilityHonesty ? <Text>{affordabilityHonesty}</Text> : null}
            {policeUk ? <Text>{policeUk}</Text> : null}
            {landRegistry ? <Text>{landRegistry}</Text> : null}
            {schools ? <Text>{schools}</Text> : null}
            {schoolsYear ? <Text>{schoolsYear}</Text> : null}
            {schoolsCoverage ? <Text>{schoolsCoverage}</Text> : null}
            {futureTransport ? <Text>{futureTransport}</Text> : null}
            {crimeMissing ? <Text>{crimeMissing}</Text> : null}
            {crimePartial ? <Text>{crimePartial}</Text> : null}
            {sizeFit ? <Text>{sizeFit}</Text> : null}
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
};
