import { beforeAll, describe, expect, it } from '@jest/globals';
import { getAlignedTicks } from '../Charts/ticks';
import type * as Band from '../Charts/band';

describe('getAlignedTicks', () => {
  it.each([
    { name: 'weight in kg', min: 65.3, max: 68.4, count: 4, expected: [64, 66, 68, 70] },
    { name: 'body fat in % on the same gridlines', min: 24.1, max: 25.6, count: 4, expected: [24, 25, 26, 27] },
    { name: 'decimal steps without float noise', min: 0.21, max: 0.58, count: 5, expected: [0.2, 0.3, 0.4, 0.5, 0.6] },
    { name: 'a flat series sits mid-axis', min: 50, max: 50, count: 3, expected: [45, 50, 55] },
    { name: 'negative values', min: -3.2, max: 4.1, count: 5, expected: [-5, -2.5, 0, 2.5, 5] },
  ])('$name', ({ min, max, count, expected }) => {
    expect(getAlignedTicks(min, max, count)).toEqual(expected);
  });

  it('always returns exactly `count` ticks covering the data', () => {
    for (const [min, max] of [[1, 7], [0.3, 0.31], [61.9, 80.4], [120, 990]] as const)
      for (const count of [2, 4, 5, 7]) {
        const ticks = getAlignedTicks(min, max, count);
        expect(ticks).toHaveLength(count);
        expect(ticks[0]).toBeLessThanOrEqual(min);
        expect(ticks[count - 1]).toBeGreaterThanOrEqual(max);
      }
  });

  it.each([
    { name: 'a single tick', count: 1 },
    { name: 'a fractional count', count: 2.5 },
    { name: 'an inverted range', count: 3, min: 5, max: 1 },
  ])('rejects $name', ({ count, min = 0, max = 1 }) => {
    expect(() => getAlignedTicks(min, max, count)).toThrow();
  });
});

describe('buildBandPath', () => {
  let B: typeof Band;

  beforeAll(async () => {
    // The skia jest mock delegates to CanvasKit, load it so Skia.Path works
    const path = require('path');
    const CanvasKitInit = require('canvaskit-wasm/bin/canvaskit.js');
    (global as any).CanvasKit = await CanvasKitInit({
      locateFile: (file: string) =>
        path.join(
          path.dirname(require.resolve('canvaskit-wasm/bin/canvaskit.js')),
          file
        ),
    });
    jest.resetModules();
    B = require('../Charts/band');
  }, 30000);

  it('spans the configured domain, upper edge on top', () => {
    const band = B.buildBandPath(
      [
        [0, 0, 2],
        [10, 5, 8],
      ],
      100,
      50,
      { minX: 0, maxX: 20, minY: 0, maxY: 10 }
    );
    const bounds = band.computeTightBounds();
    // x 0..10 of a 0..20 domain → half the width; y 0..8 of 0..10 → 40 px from the bottom
    expect(bounds.x).toBeCloseTo(0);
    expect(bounds.width).toBeCloseTo(50);
    expect(bounds.y).toBeCloseTo(10);
    expect(bounds.y + bounds.height).toBeCloseTo(50);
  });

  it('throws on empty data', () => {
    expect(() => B.buildBandPath([], 100, 50)).toThrow();
  });
});
