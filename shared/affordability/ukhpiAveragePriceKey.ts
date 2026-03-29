import type { PropertyTypeDto } from '../searchAreasContract';

/**
 * UK HPI observation fields we may read (linked-data JSON + SPARQL `ukhpi:` local names match).
 * @see https://landregistry.data.gov.uk/def/ukhpi/
 */
export const UKHPI_AVERAGE_PRICE_KEYS = [
  'averagePrice',
  'averagePriceFlatMaisonette',
  'averagePriceTerraced',
  'averagePriceSemiDetached',
  'averagePriceDetached',
] as const;

export type UkhpiAveragePriceKey = (typeof UKHPI_AVERAGE_PRICE_KEYS)[number];

/**
 * When the user picks **exactly one** property type, use the matching UK HPI average for that dwelling shape.
 * Multiple types (or none) use the **all property types** average.
 */
export const ukhpiAveragePriceKeyForPropertyTypes = (
  types: readonly PropertyTypeDto[],
): UkhpiAveragePriceKey => {
  const uniq = [...new Set(types)];
  if (uniq.length !== 1) {
    return 'averagePrice';
  }
  const t = uniq[0];
  switch (t) {
    case 'flat':
      return 'averagePriceFlatMaisonette';
    case 'terraced':
      return 'averagePriceTerraced';
    case 'semi_detached':
      return 'averagePriceSemiDetached';
    case 'detached':
    case 'bungalow':
      return 'averagePriceDetached';
    default:
      return 'averagePrice';
  }
};
