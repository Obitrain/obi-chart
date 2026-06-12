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
