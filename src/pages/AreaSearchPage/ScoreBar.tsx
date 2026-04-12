import { Box, Text } from '@chakra-ui/react';

export interface ScoreBarProps {
  readonly label: string;
  readonly value: number;
}

export const ScoreBar = ({ label, value }: ScoreBarProps) => {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 50;
  const clamped = Math.max(0, Math.min(100, safe));
  const labelText = `${label}: ${String(clamped)} out of 100`;
  return (
    <Box role="group" aria-label={labelText}>
      <Text fontSize="sm" color="fg.muted" mb={1}>
        {label}{' '}
        <Text as="span" fontWeight="medium" color="fg">
          {String(clamped)}
        </Text>
      </Text>
      <Box h="2" bg="gray.100" rounded="full" overflow="hidden" aria-hidden title={labelText}>
        <Box h="full" w={`${String(clamped)}%`} bg="blue.500" />
      </Box>
    </Box>
  );
};
