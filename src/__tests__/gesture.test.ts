import { describe, it } from '@jest/globals';
import {
  getClosestPoint,
  getOffsetBoundsWl,
  getPositionWl,
} from '../Charts/gesture';
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

describe('pinch focal math', () => {
  const WIDTH = 350;

  // Mirrors the pinch.onUpdate worklet of useScalableGesture
  const makePinchSim = function () {
    const state = { scale: 1, focalX: 0, offsetX: 0, lastScale: 1 };
    let needsPivot = true;
    return {
      state,
      start() {
        needsPivot = true;
      },
      update(eventFocalX: number, eventScale: number) {
        const prevScale = state.scale;
        const newScale = Math.max(state.lastScale * eventScale, 1);
        if (needsPivot) {
          const rebased =
            state.offsetX + (state.focalX - eventFocalX) * (1 - prevScale);
          state.offsetX = (rebased * newScale) / prevScale;
          needsPivot = false;
        } else {
          state.offsetX =
            (eventFocalX - state.focalX + state.offsetX / prevScale) *
            newScale;
        }
        state.focalX = eventFocalX;
        state.scale = newScale;
        const [minOffset, maxOffset] = getOffsetBoundsWl(
          WIDTH,
          0,
          state.focalX,
          state.scale
        );
        state.offsetX = Math.min(
          Math.max(state.offsetX, minOffset),
          maxOffset
        );
      },
      end() {
        state.lastScale = state.scale;
      },
    };
  };

  it('keeps both finger anchor points glued to the content (asymmetric pinch)', () => {
    const sim = makePinchSim();
    const fingerA = 100; // anchored on the zone of interest
    const fingerB0 = 140;
    const contentA = fingerA; // content under each finger at scale 1
    const initialSpan = fingerB0 - fingerA;

    sim.start();
    // RNGH's first update fires at the initial centroid with scale 1
    sim.update((fingerA + fingerB0) / 2, 1);
    for (let i = 1; i <= 20; i++) {
      const fingerB = fingerB0 + 5 * i; // pulls away -> focal drifts right
      const focal = (fingerA + fingerB) / 2;
      sim.update(focal, (fingerB - fingerA) / initialSpan);

      const { scale, focalX, offsetX } = sim.state;
      expect(
        getPositionWl(contentA, focalX, scale, offsetX)
      ).toBeCloseTo(fingerA, 6);
      expect(
        getPositionWl(fingerB0, focalX, scale, offsetX)
      ).toBeCloseTo(fingerB, 6);
    }
  });

  it('re-anchoring a new pinch elsewhere does not move the content', () => {
    const sim = makePinchSim();
    sim.start();
    sim.update(120, 1);
    sim.update(120, 2); // zoom x2 around 120
    sim.end();

    const probe = getPositionWl(60, sim.state.focalX, sim.state.scale, sim.state.offsetX);
    sim.start();
    sim.update(300, 1); // new gesture, fingers land elsewhere
    expect(
      getPositionWl(60, sim.state.focalX, sim.state.scale, sim.state.offsetX)
    ).toBeCloseTo(probe, 6);
  });
});

describe('getOffsetBoundsWl', () => {
  it.each([
    {
      name: 'collapses to [startOffset, startOffset] at scale 1',
      width: 350,
      startOffset: 0,
      focalX: 120,
      scale: 1,
      output: [0, 0],
    },
    {
      name: 'collapses to the startOffset point at scale 1 with an offset',
      width: 350,
      startOffset: 20,
      focalX: 0,
      scale: 1,
      output: [20, 20],
    },
    {
      name: 'allows panning a zoomed chart over its full overflow (focal 0)',
      width: 100,
      startOffset: 0,
      focalX: 0,
      scale: 4,
      output: [-300, 0],
    },
    {
      name: 'shifts the range when scaling around the right edge',
      width: 100,
      startOffset: 0,
      focalX: 100,
      scale: 4,
      output: [0, 300],
    },
    {
      name: 'splits the range around an interior focal point',
      width: 100,
      startOffset: 0,
      focalX: 25,
      scale: 3,
      output: [-150, 50],
    },
  ])('$name', ({ width, startOffset, focalX, scale, output }) => {
    const [min, max] = getOffsetBoundsWl(width, startOffset, focalX, scale);
    expect([min, max]).toEqual(output);
    expect(min).toBeLessThanOrEqual(max);
    // The bounds must pin the content edges to the viewport
    expect(getPositionWl(0, focalX, scale, max)).toBeCloseTo(startOffset);
    expect(getPositionWl(width, focalX, scale, min)).toBeCloseTo(
      width + startOffset
    );
  });
});
