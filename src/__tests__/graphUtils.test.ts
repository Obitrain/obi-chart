import { beforeAll, describe, it } from '@jest/globals';
import { PathVerb, type PathCommand } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type * as GraphUtils from '../Charts/graphUtils';

// The hooks of gesture.ts are not under test, only the pure helpers are
jest.mock('react-native-gesture-handler', () => ({ Gesture: {} }));

let U: typeof GraphUtils;

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
  U = require('../Charts/graphUtils');
}, 30000);

const sv = (value: number) => ({ value } as SharedValue<number>);

describe('buildGraph', () => {
  const data: [number, number][] = [
    [0, 0],
    [10, 100],
  ];

  it('returns the input data unchanged with its boundaries and paths', () => {
    const graph = U.buildGraph(data, 100, 50);
    expect(graph.data).toEqual([
      [0, 0],
      [10, 100],
    ]);
    expect(graph.minY).toBe(0);
    expect(graph.maxY).toBe(100);
    expect(graph.path).toMatch(/^M0,50/);
    expect(graph.skiaPath).toBeTruthy();
  });

  it.each([
    { input: 0, output: 0 },
    { input: 5, output: 50 },
    { input: 10, output: 100 },
  ])('scaleX maps $input to $output', ({ input, output }) => {
    const graph = U.buildGraph(data, 100, 50);
    expect(graph.scaleX(input)).toBe(output);
  });

  it.each([
    { input: 0, output: 50 },
    { input: 50, output: 25 },
    { input: 100, output: 0 },
  ])('scaleY maps $input to $output (inverted axis)', ({ input, output }) => {
    const graph = U.buildGraph(data, 100, 50);
    expect(graph.scaleY(input)).toBe(output);
  });

  it('builds data points in screen coordinates with the y value', () => {
    const graph = U.buildGraph(data, 100, 50);
    expect(graph.dataPoints).toEqual([
      { x: 0, y: 50, value: 0 },
      { x: 100, y: 0, value: 100 },
    ]);
  });

  it('respects the config min / max overrides', () => {
    const graph = U.buildGraph(data, 100, 50, {
      minX: -10,
      maxX: 30,
      minY: -100,
      maxY: 100,
    });
    expect(graph.minY).toBe(-100);
    expect(graph.maxY).toBe(100);
    expect(graph.scaleX(-10)).toBe(0);
    expect(graph.scaleX(30)).toBe(100);
    expect(graph.scaleY(-100)).toBe(50);
    expect(graph.scaleY(100)).toBe(0);
    expect(graph.dataPoints).toEqual([
      { x: 25, y: 25, value: 0 },
      { x: 50, y: 0, value: 100 },
    ]);
  });

  it('throws on empty data', () => {
    expect(() => U.buildGraph([], 100, 50)).toThrow(
      'buildGraph requires at least one data point'
    );
  });
});

describe('scaleCommands', () => {
  it('keeps commands untouched at scale 1 with no offset', () => {
    const commands: PathCommand[] = [
      [PathVerb.Move, 0, 50],
      [PathVerb.Line, 100, 0],
    ];
    expect(U.scaleCommands(commands, sv(1), sv(0), sv(0))).toEqual(commands);
  });

  it.each([
    {
      verb: 'Move',
      command: [PathVerb.Move, 10, 20],
      scale: 2,
      focalX: 0,
      offsetX: 5,
      output: [PathVerb.Move, 25, 20],
    },
    {
      verb: 'Line',
      command: [PathVerb.Line, 100, 40],
      scale: 2,
      focalX: 50,
      offsetX: 0,
      output: [PathVerb.Line, 150, 40],
    },
    {
      verb: 'Cubic',
      command: [PathVerb.Cubic, 10, 10, 20, 20, 30, 30],
      scale: 3,
      focalX: 0,
      offsetX: 1,
      output: [PathVerb.Cubic, 31, 10, 61, 20, 91, 30],
    },
  ])(
    'scales the x values of a $verb command around the focal point',
    ({ command, scale, focalX, offsetX, output }) => {
      expect(U.scaleCommands([command], sv(scale), sv(focalX), sv(offsetX))).toEqual([
        output,
      ]);
    }
  );

  it('scales the y values when scaleY is provided', () => {
    expect(
      U.scaleCommands([[PathVerb.Move, 10, 20]], sv(1), sv(0), sv(0), sv(2))
    ).toEqual([[PathVerb.Move, 10, 40]]);
  });

  it('throws on unsupported commands', () => {
    expect(() =>
      U.scaleCommands([[PathVerb.Conic, 0, 0, 1, 1, 0.5]], sv(1), sv(0), sv(0))
    ).toThrow(`Unsupported command type ${PathVerb.Conic}`);
  });
});
