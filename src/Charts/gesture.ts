import { clamp } from '@shopify/react-native-skia';
import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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

/**
 * Return utilities for zooming and panning the axis
 */
export const useScalableGesture = (props: AxisGestureProps) => {
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

  const animateFocalPoint = (newFocalX: number) => {
    'worklet';
    focalX.value = withTiming(newFocalX, { duration: 300 }); // Smooth transition with duration
  };

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
        // console.log(`Left Boundary reached`);
        newOffset = offsetX.value - leftBound + startOffset;
      } else if (rightBound < width) {
        // console.log(`Right Boundary reached`);
        newOffset = offsetX.value + width - rightBound + startOffset;
      } else {
        newOffset = offsetX.value;
      }
      if (newOffset === undefined) throw new Error('newOffset is undefined');

      offsetX.value = withTiming(newOffset, { duration: 300 });
      lastOffsetX.value = newOffset;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = lastScale.value * event.scale;
      scale.value = clamp(newScale, 1, Infinity); // Clamp the scale value
      animateFocalPoint(event.focalX);
    })
    .onEnd(() => {
      lastScale.value = scale.value;
      lastFocalX.value = focalX.value;
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
  scale: Animated.SharedValue<number>;
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
          if (onScaleChange !== undefined) runOnJS(onScaleChange)(i);
          break;
        }
      }
    },
    []
  );

  return { currentIndex };
};

export type UseCursorGestureProps = {
  width: number;
  height: number;
  points: Animated.SharedValue<DataPoint[]>;
  closestDataPoint?: Animated.SharedValue<DataPoint>;
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

  const xPosition = useSharedValue(0);
  const yPosition = useSharedValue(height); // GRAPH_HEIGHT

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      xPosition.value = clamp(event.x, 0, width);
      yPosition.value = clamp(event.y, 0, height);
    })
    .onUpdate((event) => {
      xPosition.value = clamp(event.x, 0, width);
      yPosition.value = clamp(event.y, 0, height);
    });

  const tapGesture = Gesture.Tap().onBegin((event) => {
    xPosition.value = clamp(event.x, 0, width);
    yPosition.value = clamp(event.y, 0, height);
  });

  useDerivedValue(() => {
    if (isContinuous) return;
    const _closestDot = getClosestPoint(xPosition.value, points.value);
    if (closestDataPoint !== undefined) closestDataPoint.value = _closestDot;
    xPosition.value = _closestDot.x;
  }, [xPosition, isContinuous]);

  return { panGesture, tapGesture, xPosition, yPosition };
};
