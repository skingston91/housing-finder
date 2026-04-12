import { describe, expect, it } from 'vitest';

import {
  applyNetworkRoutingCommuteBonus,
  applyStraightLineProxyPenalty,
  COMMUTE_SCORE_NETWORK_ROUTING_BONUS_POINTS,
  COMMUTE_SCORE_STRAIGHT_LINE_PROXY_PENALTY_POINTS,
} from './commuteScoreNetworkRoutingBonus';

describe('applyNetworkRoutingCommuteBonus', () => {
  it('adds fixed points capped at 100', () => {
    expect(applyNetworkRoutingCommuteBonus(92)).toBe(100);
    expect(applyNetworkRoutingCommuteBonus(100)).toBe(100);
  });

  it('boosts mid scores without hitting the cap', () => {
    expect(applyNetworkRoutingCommuteBonus(50)).toBe(
      50 + COMMUTE_SCORE_NETWORK_ROUTING_BONUS_POINTS,
    );
  });

  it('returns 50 for non-finite input', () => {
    expect(applyNetworkRoutingCommuteBonus(Number.NaN)).toBe(50);
  });
});

describe('applyStraightLineProxyPenalty', () => {
  it('subtracts fixed points floored at 0', () => {
    expect(applyStraightLineProxyPenalty(92)).toBe(
      92 - COMMUTE_SCORE_STRAIGHT_LINE_PROXY_PENALTY_POINTS,
    );
    expect(applyStraightLineProxyPenalty(10)).toBe(0);
  });

  it('returns 50 for non-finite input', () => {
    expect(applyStraightLineProxyPenalty(Number.NaN)).toBe(50);
  });
});
