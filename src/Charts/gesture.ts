import { clamp } from '@shopify/react-native-skia';
import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
export const useAxisGesture = (props: AxisGestureProps) => {
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
