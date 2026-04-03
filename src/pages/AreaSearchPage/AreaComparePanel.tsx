import { Box, Heading, Table, Text } from '@chakra-ui/react';
import type { RankedArea } from '@/domain/area/types';

export interface AreaComparePanelProps {
  readonly areas: readonly RankedArea[];
}

export const AreaComparePanel = ({ areas }: AreaComparePanelProps) => {
  if (areas.length < 2) {
    return null;
  }
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      rounded="xl"
      p={{ base: 4, md: 5 }}
      bg="white"
      shadow="sm"
    >
      <Heading as="h3" size="sm" mb={3} fontWeight="semibold">
        Compare areas
      </Heading>
      <Box overflowX="auto">
        <Table.Root size="sm" variant="line" minW="md">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader scope="col">Area</Table.ColumnHeader>
              <Table.ColumnHeader scope="col" textAlign="end">
                Total
              </Table.ColumnHeader>
              <Table.ColumnHeader scope="col" textAlign="end">
                Afford.
              </Table.ColumnHeader>
              <Table.ColumnHeader scope="col" textAlign="end">
                Commute
              </Table.ColumnHeader>
              <Table.ColumnHeader scope="col" textAlign="end">
                Schools
              </Table.ColumnHeader>
              <Table.ColumnHeader scope="col" textAlign="end">
                Crime
              </Table.ColumnHeader>
              <Table.ColumnHeader scope="col" textAlign="end">
                Price mom.
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {areas.map((a) => (
              <Table.Row key={a.id}>
                <Table.Cell>
                  <Text fontWeight="medium">{a.displayName}</Text>
                </Table.Cell>
                <Table.Cell textAlign="end" fontFamily="mono">
                  {String(a.score)}
                </Table.Cell>
                <Table.Cell textAlign="end" fontFamily="mono">
                  {String(a.breakdown.affordability)}
                </Table.Cell>
                <Table.Cell textAlign="end" fontFamily="mono">
                  {String(a.breakdown.commute)}
                </Table.Cell>
                <Table.Cell textAlign="end" fontFamily="mono">
                  {String(a.breakdown.schools)}
                </Table.Cell>
                <Table.Cell textAlign="end" fontFamily="mono">
                  {String(a.breakdown.crime)}
                </Table.Cell>
                <Table.Cell textAlign="end" fontFamily="mono">
                  {String(a.breakdown.priceTrend)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      <Text fontSize="xs" color="fg.muted" mt={3}>
        Same scores as the cards; for discovery only—not admissions or conveyancing advice.
      </Text>
    </Box>
  );
};
