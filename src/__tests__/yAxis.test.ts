import { describe, expect, it } from '@jest/globals';
import { getPaddedTicks } from '../Charts/YAxis';

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
