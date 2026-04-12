import { Box, Stack, Text } from '@chakra-ui/react';

export interface SearchDataQualitySummary {
  readonly crimeWindowMonths: number;
  readonly ukhpiRefMonth?: string;
  readonly ukhpiPriceMeasure?: string;
  readonly schoolsPerformanceAcademicYear?: string;
  readonly affordabilityPriceSource?: string;
}

export interface SearchDataQualityPanelProps {
  readonly summary: SearchDataQualitySummary;
}

/**
 * Compact provenance for the current search run (first result’s metadata + form crime window).
 */
export const SearchDataQualityPanel = ({ summary }: SearchDataQualityPanelProps) => {
  const rows: { label: string; value: string }[] = [
    { label: 'Crime window', value: `${String(summary.crimeWindowMonths)} month(s) (police.uk)` },
  ];
  if (summary.ukhpiRefMonth !== undefined && summary.ukhpiRefMonth.trim() !== '') {
    rows.push({
      label: 'UK HPI reference month (affordability)',
      value: summary.ukhpiRefMonth.trim(),
    });
  }
  if (summary.ukhpiPriceMeasure !== undefined && summary.ukhpiPriceMeasure.trim() !== '') {
    rows.push({
      label: 'UK HPI measure',
      value: summary.ukhpiPriceMeasure.trim(),
    });
  }
  if (
    summary.schoolsPerformanceAcademicYear !== undefined &&
    summary.schoolsPerformanceAcademicYear.trim() !== ''
  ) {
    rows.push({
      label: 'Schools performance data (year)',
      value: summary.schoolsPerformanceAcademicYear.trim(),
    });
  }
  if (
    summary.affordabilityPriceSource !== undefined &&
    summary.affordabilityPriceSource.trim() !== ''
  ) {
    rows.push({
      label: 'Affordability price source',
      value: summary.affordabilityPriceSource.trim(),
    });
  }

  return (
    <Box borderWidth="1px" borderColor="border.muted" rounded="md" px={3} py={2} bg="gray.50">
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={2}>
        Data behind this run
      </Text>
      <Stack as="dl" gap={1}>
        {rows.map((r) => (
          <Box key={r.label}>
            <Text as="dt" fontSize="xs" color="fg.muted">
              {r.label}
            </Text>
            <Text as="dd" fontSize="xs" ml={0} fontWeight="medium">
              {r.value}
            </Text>
          </Box>
        ))}
      </Stack>
      <Text fontSize="xs" color="fg.muted" mt={2} lineHeight="short">
        Relative scores (crime, momentum, commute spread, floor-area fit) use the candidates in this
        list after commute filtering. See methodology below for caveats.
      </Text>
    </Box>
  );
};
