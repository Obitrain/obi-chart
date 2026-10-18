import { describe, expect, it } from '@jest/globals';
import { getHeatCells } from '../Charts/HeatStrip';
import { getBandStops } from '../Charts/Linechart/utils';
import { getRingArcs } from '../Charts/Ring';

describe('getBandStops', () => {
  // 100 → 200 on the plot: 0.01 offset per unit, 200 at the top
  const BANDS = [
    { from: 100, to: 150, color: 'z1' },
    { from: 150, to: 180, color: 'z2' },
  ];

  it.each([
    {
      name: 'fills above the last band with the fallback',
      bands: BANDS,
      expected: [
        { offset: 0, color: 'none' }, { offset: 0.2, color: 'none' },
        { offset: 0.2, color: 'z2' }, { offset: 0.5, color: 'z2' },
        { offset: 0.5, color: 'z1' }, { offset: 1, color: 'z1' },
      ],
    },
    {
      name: 'clips open-ended bands to the plot',
      bands: [{ to: 120, color: 'low' }, { from: 160, color: 'high' }],
      expected: [
        { offset: 0, color: 'high' }, { offset: 0.4, color: 'high' },
        { offset: 0.4, color: 'none' }, { offset: 0.8, color: 'none' },
        { offset: 0.8, color: 'low' }, { offset: 1, color: 'low' },
      ],
    },
    {
      name: 'drops bands outside the plot',
      bands: [{ from: 210, to: 250, color: 'out' }],
      expected: [{ offset: 0, color: 'none' }, { offset: 1, color: 'none' }],
    },
  ])('$name', ({ bands, expected }) => {
    expect(getBandStops(bands, 100, 200, 'none')).toEqual(expected);
  });

  it('returns no stops on a flat plot', () => {
    expect(getBandStops(BANDS, 100, 100, 'none')).toEqual([]);
  });
});

describe('getHeatCells', () => {
  it.each([
    { name: 'averages values per cell and scales min → max', values: [0, 0, 5, 5, 10, 10], nbCells: 3, expected: [0.1, 0.55, 1] },
    { name: 'empty cells are transparent', values: [undefined, undefined, 4, 8], nbCells: 2, expected: [0, 1] },
    { name: 'flat series is fully opaque', values: [3, 3, 3], nbCells: 3, expected: [1, 1, 1] },
    { name: 'more cells than values reuses samples', values: [0, 10], nbCells: 4, expected: [0.1, 0.1, 1, 1] },
  ])('$name', ({ values, nbCells, expected }) => {
    const cells = getHeatCells(values, nbCells, { minOpacity: 0.1 });
    expect(cells).toHaveLength(expected.length);
    cells.forEach((x, i) => expect(x).toBeCloseTo(expected[i]!));
  });

  it('honours explicit bounds', () => {
    expect(getHeatCells([50], 1, { minValue: 0, maxValue: 100, minOpacity: 0 })).toEqual([0.5]);
  });
});

describe('getRingArcs', () => {
  it.each([
    {
      name: 'splits the circle proportionally from 12 o\'clock',
      values: [1, 3], gap: 0,
      expected: [{ start: -90, sweep: 90 }, { start: 0, sweep: 270 }],
    },
    {
      name: 'leaves a gap between non-empty segments only',
      values: [1, 0, 1], gap: 10,
      expected: [{ start: -85, sweep: 170 }, { start: 95, sweep: 0 }, { start: 95, sweep: 170 }],
    },
    {
      name: 'no gap around a single segment',
      values: [0, 5], gap: 10,
      expected: [{ start: -90, sweep: 0 }, { start: -90, sweep: 360 }],
    },
    {
      name: 'all empty',
      values: [0, 0], gap: 10,
      expected: [{ start: -90, sweep: 0 }, { start: -90, sweep: 0 }],
    },
  ])('$name', ({ values, gap, expected }) => {
    expect(getRingArcs(values, gap)).toEqual(expected);
  });
});
