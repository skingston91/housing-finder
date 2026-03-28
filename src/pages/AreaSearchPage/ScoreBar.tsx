import { Box, Text } from '@chakra-ui/react';

export interface ScoreBarProps {
  readonly label: string;
  readonly value: number;
}

export const ScoreBar = ({ label, value }: ScoreBarProps) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <Box>
      <Text fontSize="sm" color="fg.muted" mb={1}>
        {label}{' '}
        <Text as="span" fontWeight="medium" color="fg">
          {String(clamped)}
        </Text>
      </Text>
      <Box h="2" bg="gray.100" rounded="full" overflow="hidden">
        <Box h="full" w={`${String(clamped)}%`} bg="blue.500" />
      </Box>
    </Box>
  );
};
