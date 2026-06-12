import { clamp } from '@shopify/react-native-skia';
import { useCallback } from 'react';
import { Gesture, type PanGesture, type PinchGesture } from 'react-native-gesture-handler';
import {
    useAnimatedReaction,
    useSharedValue,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { DataPoint } from './types';

/**
 * Get the position of a point on the axis,
 * given the current focal, scale and offset
 */
export const getPositionWl = function (
  position: number,
  focalX: number,
  scale: number,
  offsetX: number
) {
  'worklet';
  return (position - focalX) * scale + focalX + offsetX;
};

export type AxisGestureProps = {
  width: number;
  startOffset?: number;
  startScale?: number;
};

export type ScalableGesture = {
    scale: SharedValue<number>;
    focalX: SharedValue<number>;
    pinchGesture: PinchGesture;
    panGesture: PanGesture;
    offsetX: SharedValue<number>;
    reset: () => void;
};

/**
 * Return utilities for zooming and panning the axis
 */
export const useScalableGesture = (props: AxisGestureProps): ScalableGesture => {
  const { width } = props;
  const startOffset = props.startOffset ?? 0;
  const startScale = props.startScale ?? 1;
  // For zooming
  const scale = useSharedValue(startScale);
  const lastScale = useSharedValue(startScale);
  const focalX = useSharedValue(0);
  const lastFocalX = useSharedValue(0);

  // For panning
  const offsetX = useSharedValue(startOffset);
  const lastOffsetX = useSharedValue(startOffset);

  const reset = useCallback(() => {
    scale.value = startScale;
    lastScale.value = startScale;
    focalX.value = 0;
    lastFocalX.value = 0;
    offsetX.value = startOffset;
    lastOffsetX.value = startOffset;
  }, [
    focalX,
    lastFocalX,
    lastOffsetX,
    lastScale,
    offsetX,
    scale,
    startOffset,
    startScale,
  ]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newOffsetX = lastOffsetX.value + event.translationX;
      offsetX.value = newOffsetX;
    })
    .onEnd(() => {
      lastScale.value = scale.value;
      lastFocalX.value = focalX.value;

      const leftBound = getPositionWl(
        0,
        focalX.value,
        scale.value,
        offsetX.value
      );
      const rightBound = getPositionWl(
        width,
        focalX.value,
        scale.value,
        offsetX.value
      );

      let newOffset;

      if (leftBound > startOffset) {
        newOffset = offsetX.value - leftBound + startOffset;
      } else if (rightBound < width + startOffset) {
        newOffset = offsetX.value + width - rightBound + startOffset;
      } else {
        newOffset = offsetX.value;
      }

      offsetX.value = withTiming(newOffset, { duration: 300 });
      lastOffsetX.value = newOffset;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // Rebase offsetX so moving the focal point doesn't shift the content
      offsetX.value += (focalX.value - event.focalX) * (1 - scale.value);
      focalX.value = event.focalX;
      scale.value = clamp(lastScale.value * event.scale, 1, Infinity);
    })
    .onEnd(() => {
      lastScale.value = scale.value;
      lastFocalX.value = focalX.value;
      lastOffsetX.value = offsetX.value;
    });

  return {
    scale,
    focalX,
    pinchGesture,
    panGesture,
    offsetX,
    reset,
  };
};

export type UpdateAxisProps = {
  scale: SharedValue<number>;
  scales: number[];
  onScaleChange?: (index: number) => void;
};

export const useUpdateAxis = function (props: UpdateAxisProps) {
  const { scale, scales, onScaleChange } = props;
  const currentIndex = useSharedValue(0);

  useAnimatedReaction(
    () => scale.value,
    (currentScale, _) => {
      for (let i = 0; i < scales.length; i++) {
        const _prevScale = scales[i - 1] ?? 0;
        const _curScale = scales[i];
        if (_curScale === undefined || _prevScale === undefined)
          throw new Error('Got undefined scale');

        if (
          currentScale >= _prevScale &&
          currentScale < _curScale &&
          currentIndex.value !== i
        ) {
          currentIndex.value = i;
          if (onScaleChange !== undefined) scheduleOnRN(onScaleChange, i);
          break;
        }
      }
    }
  );

  return { currentIndex };
};

export type UseCursorGestureProps = {
  width: number;
  height: number;
  points?: SharedValue<DataPoint[]>;
  closestDataPoint?: SharedValue<DataPoint>;
  isContinuous?: boolean;
};

/**
 * Get the closest point for a given x value
 */
export const getClosestPoint = function (
  x: number,
  dataPoints: DataPoint[]
): DataPoint {
  'worklet';
  let closestPoint = dataPoints[0];
  if (closestPoint === undefined)
    throw new Error('dataPoints array cannot be empty');

  let minDistance = Math.abs(x - closestPoint.x);
  for (let i = 1; i < dataPoints.length; i++) {
    const point = dataPoints[i];
    if (point === undefined) throw new Error('Point cannot be undefined');
    const distance = Math.abs(x - point.x);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }
  return closestPoint;
};

/**
 * Get gesture utilities for the cursor
 */
export const useCursorGesture = function (props: UseCursorGestureProps) {
  const {
    width,
    height,
    points,
    closestDataPoint,
    isContinuous = true,
  } = props;

  if (!isContinuous && points === undefined)
    console.warn('Points must be defined for non-continuous mode');

  const xPosition = useSharedValue(0);
  const yPosition = useSharedValue(height);

  const setPosition = (x: number, y: number) => {
    'worklet';
    yPosition.value = clamp(y, 0, height);
    if (isContinuous || points === undefined) {
      xPosition.value = clamp(x, 0, width);
      return;
    }
    const _closestDot = getClosestPoint(clamp(x, 0, width), points.value);
    if (closestDataPoint !== undefined) closestDataPoint.value = _closestDot;
    xPosition.value = _closestDot.x;
  };

  const panGesture = Gesture.Pan()
    .onBegin((event) => setPosition(event.x, event.y))
    .onUpdate((event) => setPosition(event.x, event.y));

  const tapGesture = Gesture.Tap().onBegin((event) =>
    setPosition(event.x, event.y)
  );

  // Re-snap the cursor when the data points change (e.g. switching graphs)
  useAnimatedReaction(
    () => points?.value,
    (_points) => {
      if (isContinuous || _points === undefined || _points.length === 0)
        return;
      const _closestDot = getClosestPoint(xPosition.value, _points);
      if (closestDataPoint !== undefined) closestDataPoint.value = _closestDot;
      xPosition.value = _closestDot.x;
    }
  );

  return { panGesture, tapGesture, xPosition, yPosition };
};
