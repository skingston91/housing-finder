import {
  Alert,
  Box,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { RankedAreaDto } from '@shared/searchAreasContract';
import { useCallback, useState } from 'react';

import { postSearchAreas } from '@/services/searchAreasClient';

import { AreaResultCard } from './AreaResultCard';
import { AreaSearchCriteriaForm } from './AreaSearchCriteriaForm';
import { buildSearchAreasRequest, defaultFormState } from './buildSearchAreasRequest';

export const AreaSearchPage = () => {
  const [form, setForm] = useState(defaultFormState);
  const [areas, setAreas] = useState<readonly RankedAreaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setError(null);
    const body = buildSearchAreasRequest(form);
    if (!body) {
      setError(
        'Check your inputs — property types, workplace, schools, and crime JSON must be valid.',
      );
      return;
    }
    setLoading(true);
    try {
      const res = await postSearchAreas(body);
      setAreas(res.areas);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      setError(msg);
      setAreas([]);
    } finally {
      setLoading(false);
    }
  }, [form]);

  return (
    <Box minH="100dvh" bg="gray.50" color="fg">
      <Container maxW="6xl" py={{ base: 8, md: 12 }}>
        <Stack gap={10}>
          <Stack gap={3} maxW="3xl">
            <Heading as="h1" size="3xl" fontWeight="semibold" letterSpacing="-0.03em">
              Find areas to buy
            </Heading>
            <Text fontSize="lg" color="fg.muted">
              Set your budget, commute, schools, and crime preferences — we rank{' '}
              <Text as="span" fontWeight="medium" color="fg">
                locations
              </Text>{' '}
              first (Jitty-style discovery). Live listing feeds wait on commercial API access.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 8, lg: 10 }} alignItems="start">
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              rounded="xl"
              p={{ base: 4, md: 6 }}
              bg="white"
              shadow="sm"
            >
              <AreaSearchCriteriaForm
                form={form}
                onChange={setForm}
                onSubmit={() => {
                  void handleSearch();
                }}
                isLoading={loading}
              />
            </Box>

            <Stack gap={4}>
              <Heading size="md">Results</Heading>
              {loading ? <HStackSpinner /> : null}
              {error ? (
                <Alert.Root status="error" variant="subtle">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Search error</Alert.Title>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              ) : null}
              {!loading && !error && areas.length === 0 ? (
                <Text color="fg.muted" fontSize="sm">
                  Run a search to see ranked areas. With{' '}
                  <Text as="span" fontWeight="medium">
                    npm run dev
                  </Text>
                  , start{' '}
                  <Text as="span" fontWeight="medium">
                    vercel dev
                  </Text>{' '}
                  on port 3000 so{' '}
                  <Text as="span" fontFamily="mono">
                    /api/search-areas
                  </Text>{' '}
                  is available (see docs/development.md).
                </Text>
              ) : null}
              <SimpleGrid columns={1} gap={4}>
                {areas.map((a) => (
                  <AreaResultCard key={a.id} area={a} />
                ))}
              </SimpleGrid>
            </Stack>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

const HStackSpinner = () => (
  <HStack gap={2}>
    <Spinner size="sm" />
    <Text fontSize="sm" color="fg.muted">
      Ranking areas…
    </Text>
  </HStack>
);
