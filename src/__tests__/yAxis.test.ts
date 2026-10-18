import { describe, expect, it } from '@jest/globals';
import { getNiceTicks, getPaddedTicks } from '../Charts/YAxis';

describe('getPaddedTicks', () => {
  it.each([
    { name: 'pads above the max and starts at zero', max: 90, nbTicks: 4, expected: [0, 26, 52, 78, 104] },
    { name: 'rounds the step up so the max always fits', max: 15.7, nbTicks: 4, expected: [0, 5, 10, 15, 20] },
    { name: 'honours a custom tick count', max: 90, nbTicks: 2, expected: [0, 52, 104] },
    { name: 'never collapses to a zero step', max: 0, nbTicks: 4, expected: [0, 1, 2, 3, 4] },
  ])('$name', ({ max, nbTicks, expected }) => {
    expect(getPaddedTicks(max, nbTicks)).toEqual(expected);
  });

  it('keeps the highest tick at or above the data max', () => {
    for (const max of [1, 7, 15.72, 33.3, 99, 104]) {
      const ticks = getPaddedTicks(max);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });
});

describe('getNiceTicks', () => {
  it.each([
    { name: 'offset range', min: 94, max: 175, maxTicks: 5, expected: [75, 100, 125, 150, 175] },
    { name: 'range from zero', min: 0, max: 323, maxTicks: 5, expected: [0, 100, 200, 300, 400] },
    { name: 'widens the step when snapping adds a segment', min: 87, max: 184, maxTicks: 5, expected: [50, 100, 150, 200] },
    { name: 'decimal range', min: 12.3, max: 31.4, maxTicks: 5, expected: [10, 20, 30, 40] },
    { name: 'small decimal range without float noise', min: 0.1, max: 0.7, maxTicks: 4, expected: [0, 0.25, 0.5, 0.75] },
    { name: 'flat series still spans one step', min: 100, max: 100, maxTicks: 5, expected: [100, 200] },
  ])('$name', ({ min, max, maxTicks, expected }) => {
    expect(getNiceTicks(min, max, maxTicks)).toEqual(expected);
  });

  it('always covers the data and respects maxTicks', () => {
    for (const [min, max] of [[0, 1], [3, 97], [94, 175], [-12, 48], [1000, 1873], [0.2, 0.9]] as const)
      for (const maxTicks of [3, 4, 5, 6]) {
        const ticks = getNiceTicks(min, max, maxTicks);
        expect(ticks[0]).toBeLessThanOrEqual(min);
        expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
        expect(ticks.length).toBeLessThanOrEqual(maxTicks);
      }
  });
});
