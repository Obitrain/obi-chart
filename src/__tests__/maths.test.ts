import { describe, it } from '@jest/globals';
import {
  PathVerb,
  vec,
  type PathCommand,
} from '@shopify/react-native-skia';
import * as M from '../Charts/maths';

describe('commandsToBezier', () => {
  it('converts Line commands to Cubic commands preserving endpoints', () => {
    expect(
      M.commandsToBezier([
        [PathVerb.Move, 0, 0],
        [PathVerb.Line, 10, 10],
        [PathVerb.Line, 20, 0],
      ])
    ).toEqual([
      [PathVerb.Move, 0, 0],
      [PathVerb.Cubic, 0, 0, 10, 10, 10, 10],
      [PathVerb.Cubic, 10, 10, 20, 0, 20, 0],
    ]);
  });

  it('keeps non-line commands untouched', () => {
    const cmds: PathCommand[] = [
      [PathVerb.Move, 0, 0],
      [PathVerb.Cubic, 1, 1, 2, 2, 3, 3],
    ];
    expect(M.commandsToBezier(cmds)).toEqual(cmds);
  });
});

describe('selectCurve', () => {
  const cmds: PathCommand[] = [
    [PathVerb.Move, 0, 0],
    [PathVerb.Cubic, 0, 0, 10, 10, 10, 10],
    [PathVerb.Cubic, 10, 10, 20, 0, 20, 0],
  ];

  it.each([
    { x: 5, from: [0, 0], to: [10, 10] },
    { x: 15, from: [10, 10], to: [20, 0] },
  ])('picks the segment containing x = $x', ({ x, from, to }) => {
    const curve = M.selectCurve(cmds, x);
    expect(curve).toBeDefined();
    expect([curve!.from.x, curve!.from.y]).toEqual(from);
    expect([curve!.to.x, curve!.to.y]).toEqual(to);
  });

  it('returns undefined when x is outside the segments', () => {
    expect(M.selectCurve(cmds, 25)).toBeUndefined();
  });
});

describe('cubicBezierYForX', () => {
  // Control points at thirds of the segment make the cubic a straight y = x line
  const a = vec(0, 0);
  const b = vec(10 / 3, 10 / 3);
  const c = vec(20 / 3, 20 / 3);
  const d = vec(10, 10);

  it.each([
    { x: 2.5, y: 2.5 },
    { x: 5, y: 5 },
    { x: 7.5, y: 7.5 },
  ])('returns y = $y at x = $x on a straight line cubic', ({ x, y }) => {
    expect(M.cubicBezierYForX(x, a, b, c, d)).toBeCloseTo(y);
  });
});

describe('getYForX', () => {
  const cmds = M.commandsToBezier([
    [PathVerb.Move, 0, 0],
    [PathVerb.Line, 10, 10],
  ]);

  it.each([
    { x: 0, y: 0 },
    { x: 5, y: 5 },
    { x: 10, y: 10 },
  ])('returns y = $y at x = $x on the y = x line', ({ x, y }) => {
    expect(M.getYForX(cmds, x)).toBeCloseTo(y);
  });

  it('returns undefined when x is outside the path', () => {
    expect(M.getYForX(cmds, 20)).toBeUndefined();
  });
});

describe('getYForXOnBeziers', () => {
  const curved = M.commandsToBezier([
    [PathVerb.Move, 0, 0],
    [PathVerb.Cubic, 2, 8, 6, 8, 10, 0],
    [PathVerb.Cubic, 12, -5, 18, -5, 20, 0],
  ]);
  const straight = M.commandsToBezier([
    [PathVerb.Move, 0, 0],
    [PathVerb.Line, 3, 1],
    [PathVerb.Line, 3, 4],
    [PathVerb.Line, 9, 4],
  ]);

  it.each([
    { x: 1, y: 1 / 3, label: 'exact on a sloped line' },
    { x: 3, y: 1, label: 'first match on a vertical line' },
    { x: 6, y: 4, label: 'flat line' },
    { x: 12, y: undefined, label: 'outside the path' },
  ])('$label (x = $x)', ({ x, y }) => {
    const value = M.getYForXOnBeziers(straight, x);
    if (y === undefined) expect(value).toBeUndefined();
    else expect(value).toBeCloseTo(y, 10);
  });

  // getYForX rounds t to 2 decimals by default, which is what made dots wobble
  it.each([1, 4.5, 9.9, 13, 19])('matches unrounded getYForX at x = %p', (x) => {
    expect(M.getYForXOnBeziers(curved, x)).toBeCloseTo(M.getYForX(curved, x, 10)!, 6);
  });
});

describe('findBezierIndex', () => {
  const cmds = M.commandsToBezier([
    [PathVerb.Move, 0, 0],
    [PathVerb.Line, 10, 0],
    [PathVerb.Line, 20, 0],
  ]);

  it.each([
    { x: 5, start: 0, index: 1, label: 'first segment' },
    { x: 15, start: 0, index: 2, label: 'second segment' },
    { x: 15, start: 2, index: 2, label: 'resumes from a later segment' },
    { x: 5, start: 2, index: -1, label: 'misses x before the start' },
    { x: 25, start: 0, index: -1, label: 'outside the path' },
  ])('$label', ({ x, start, index }) => {
    expect(M.findBezierIndex(cmds, x, start)).toBe(index);
  });
});
