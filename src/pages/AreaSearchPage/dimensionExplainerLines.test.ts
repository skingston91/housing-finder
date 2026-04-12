import { describe, expect, it } from 'vitest';

import {
  commuteDimensionExplanationLine,
  priceTrendDimensionExplanationLine,
} from './dimensionExplainerLines';

describe('commuteDimensionExplanationLine', () => {
  it('combines model, minutes, budget, and 100 rule', () => {
    const line = commuteDimensionExplanationLine({
      commuteModel: 'straight-line-time-estimate',
      commuteJourneyMinutes: 20,
      commuteMaxMinutes: 60,
    });
    expect(line).toContain('Straight-line');
    expect(line).toContain('20.0 min');
    expect(line).toContain('60 min budget');
    expect(line).toMatch(/100/);
  });

  it('notes network-route bonus when present', () => {
    const line = commuteDimensionExplanationLine({
      commuteModel: 'tfl-unified-api',
      commuteJourneyMinutes: 20,
      commuteMaxMinutes: 60,
      commuteNetworkRoutingBonusApplied: 25,
    });
    expect(line).toContain('+25 network-route bonus');
  });

  it('notes straight-line proxy penalty when present', () => {
    const line = commuteDimensionExplanationLine({
      commuteModel: 'straight-line-time-estimate',
      commuteJourneyMinutes: 12,
      commuteMaxMinutes: 45,
      commuteStraightLineProxyPenaltyApplied: 15,
    });
    expect(line).toContain('-15 straight-line proxy');
  });

  it('notes routing API failure extra penalty when present', () => {
    const line = commuteDimensionExplanationLine({
      commuteModel: 'tfl-fallback-straight-line',
      commuteJourneyMinutes: 28,
      commuteMaxMinutes: 40,
      commuteStraightLineProxyPenaltyApplied: 15,
      commuteRoutingApiFailureExtraPenaltyApplied: 25,
    });
    expect(line).toContain('-25 no confirmed route');
  });
});

describe('priceTrendDimensionExplanationLine', () => {
  it('explains stub demo', () => {
    expect(priceTrendDimensionExplanationLine({ stub: 1 })).toMatch(/Demo ranking/);
  });

  it('explains unavailable model', () => {
    expect(priceTrendDimensionExplanationLine({ priceTrendModel: 'unavailable' })).toMatch(
      /UK HPI/,
    );
  });

  it('explains tied YoY', () => {
    expect(
      priceTrendDimensionExplanationLine({
        priceTrendModel: 'ukhpi-borough-yoy',
        priceTrendYoyPct: 2.5,
        priceTrendHasSpread: 0,
      }),
    ).toMatch(/tie at 50/);
  });
});
