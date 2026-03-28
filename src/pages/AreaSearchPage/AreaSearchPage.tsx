import { Box, Button, Container, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useState } from 'react';

export const AreaSearchPage = () => {
  const [workplaceLabel, setWorkplaceLabel] = useState('');

  return (
    <Box minH="100dvh" bg="bg.subtle" color="fg">
      <Container maxW="4xl" py={{ base: 8, md: 12 }}>
        <Stack gap={8}>
          <Stack gap={2}>
            <Heading as="h1" size="3xl" fontWeight="semibold" letterSpacing="-0.02em">
              Find areas to buy
            </Heading>
            <Text color="fg.muted" fontSize="md" maxW="2xl">
              London-first discovery using affordability, commute, schools, and crime signals.
              Listing feeds are out of scope until commercial API access; phase 1 ranks locations.
            </Text>
          </Stack>

          <Box
            borderWidth="1px"
            borderColor="border"
            rounded="lg"
            p={{ base: 4, md: 6 }}
            bg="bg.panel"
          >
            <Stack
              gap={4}
              as="form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <Stack gap={1}>
                <Text fontWeight="medium">Workplace (label)</Text>
                <Input
                  placeholder="e.g. Old Street"
                  value={workplaceLabel}
                  onChange={(e) => {
                    setWorkplaceLabel(e.target.value);
                  }}
                  aria-label="Workplace label"
                />
              </Stack>
              <Button type="submit" colorPalette="blue" alignSelf="flex-start">
                Search areas (stub)
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
