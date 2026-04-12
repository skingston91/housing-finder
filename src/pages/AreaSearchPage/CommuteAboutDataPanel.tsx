import { Box, Stack, Text } from '@chakra-ui/react';

/**
 * Explains how commute times are produced (TfL, ORS, straight-line) and default planner behaviour.
 * Static copy — pair with results banners when routing APIs are unavailable.
 */
export const CommuteAboutDataPanel = () => (
  <Box as="details" borderWidth="1px" borderColor="gray.200" rounded="lg" p={3} bg="white">
    <Box
      as="summary"
      cursor="pointer"
      fontWeight="medium"
      fontSize="sm"
      color="fg.muted"
      _hover={{ color: 'fg' }}
    >
      About commute data
    </Box>
    <Stack gap={2} mt={3} fontSize="sm">
      <Text>
        <Text as="span" fontWeight="medium">
          Coverage:
        </Text>{' '}
        Ranked{' '}
        <Text as="span" fontWeight="medium">
          areas
        </Text>{' '}
        are only sampled inside a rough Greater London preview box (see methodology on results). If
        your workplace is outside that box (e.g. Reading), we still score commute from your
        workplace to fixed London centroids — we do{' '}
        <Text as="span" fontWeight="medium">
          not
        </Text>{' '}
        place a grid around Reading. TfL can still plan journeys from e.g. Reading to London when
        the API returns a route (national rail may apply).
      </Text>
      <Text>
        <Text as="span" fontWeight="medium">
          Transit:
        </Text>{' '}
        When the search API has a valid{' '}
        <Text as="span" fontWeight="medium">
          TFL_APP_KEY
        </Text>
        , commute times use the Transport for London Journey Planner (tube, bus, DLR, rail modes as
        configured). If you see straight-line fallback on cards, TfL did not return a usable
        journey—check the key, rate limits (HTTP 429), or TfL outages (5xx). Unless you set date and
        time (or opt out), the planner uses the next eligible weekday{' '}
        <Text as="span" fontWeight="medium">
          08:30
        </Text>{' '}
        Europe/London departure. Requests use timetable-style planning (not live platform boards).
      </Text>
      <Text>
        <Text as="span" fontWeight="medium">
          Drive / cycle / walk:
        </Text>{' '}
        When the search API has an OpenRouteService key, those modes use road or path network
        routes. Without a key, the app falls back to straight-line distance and assumed speeds.
      </Text>
      <Text>
        <Text as="span" fontWeight="medium">
          Scoring:
        </Text>{' '}
        TfL journeys may be adjusted slightly downward when disruption is flagged or when a second
        acceptable route is much slower (volatility). Each result’s details show the commute model
        and any warnings.
      </Text>
    </Stack>
  </Box>
);
