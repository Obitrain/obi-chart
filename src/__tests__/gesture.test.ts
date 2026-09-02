import { describe, it } from '@jest/globals';
import { getClosestPoint, getPositionWl } from '../Charts/gesture';
import type { DataPoint } from '../Charts/types';

// The hooks of gesture.ts are not under test, only the pure helpers are
jest.mock('react-native-gesture-handler', () => ({ Gesture: {} }));

describe('getPositionWl', () => {
  it.each([
    {
      name: 'is the identity at scale 1 with no offset',
      position: 42,
      focalX: 0,
      scale: 1,
      offsetX: 0,
      output: 42,
    },
    {
      name: 'translates by the offset',
      position: 10,
      focalX: 0,
      scale: 1,
      offsetX: 5,
      output: 15,
    },
    {
      name: 'scales around the focal point: (pos - f) * s + f + off',
      position: 10,
      focalX: 5,
      scale: 2,
      offsetX: 3,
      output: 18,
    },
    {
      name: 'keeps the focal point fixed when only scaling',
      position: 5,
      focalX: 5,
      scale: 3,
      offsetX: 0,
      output: 5,
    },
  ])('$name', ({ position, focalX, scale, offsetX, output }) => {
    expect(getPositionWl(position, focalX, scale, offsetX)).toBe(output);
  });
});

describe('getClosestPoint', () => {
  const points: DataPoint[] = [
    { x: 0, y: 0, value: 1 },
    { x: 10, y: 5, value: 2 },
    { x: 20, y: 10, value: 3 },
  ];

  it.each([
    { x: 2, output: { x: 0, y: 0, value: 1 } },
    { x: 12, output: { x: 10, y: 5, value: 2 } },
    { x: 100, output: { x: 20, y: 10, value: 3 } },
    // Ties resolve to the earliest point
    { x: 5, output: { x: 0, y: 0, value: 1 } },
  ])('returns the closest point for x = $x', ({ x, output }) => {
    expect(getClosestPoint(x, points)).toEqual(output);
  });

  it('throws on an empty array', () => {
    expect(() => getClosestPoint(5, [])).toThrow(
      'dataPoints array cannot be empty'
    );
  });
});
