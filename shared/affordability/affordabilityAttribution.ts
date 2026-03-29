import type { AffordabilityMedianPriceSource } from './resolveLondonBoroughMedianRows';

/** UI / metadata line for Land Registry–related affordability signals (OGL). */
export const affordabilityLandRegistryAttribution = (
  priceSource: AffordabilityMedianPriceSource,
): string => {
  const ogl = 'Contains public sector information licensed under the Open Government Licence v3.0.';
  const disclaimer = 'Discovery only — not transactional valuations.';
  if (priceSource === 'ukhpi-linked-data') {
    return `Affordability benchmarks from HM Land Registry UK HPI (linked-data JSON), latest month per borough. ${disclaimer} ${ogl}`;
  }
  if (priceSource === 'ukhpi-partial-static-fallback') {
    return `Affordability mixes live UK HPI averages with static borough fallbacks where a fetch failed. ${disclaimer} ${ogl}`;
  }
  return `Indicative borough medians from an in-repo reference table. ${disclaimer} ${ogl}`;
};
