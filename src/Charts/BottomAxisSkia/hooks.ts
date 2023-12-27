import { clamp } from '@shopify/react-native-skia';
import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { getPositionWl } from './Tick';

export type AxisGestureProps = {
  axisWidth: number;
  nbTicks: number;
  startOffset?: number;
  startScale?: number;
};

export const useAxisGesture = (props: AxisGestureProps) => {
  const { axisWidth, nbTicks } = props;
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
  const tickInterval = axisWidth / nbTicks;

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newOffsetX = lastOffsetX.value + event.translationX;
      console.log({
        offsetX: event.translationX,
        scale: scale.value,
        newOffsetX,
      });
      //   if (scale.value > 1) {
      offsetX.value = newOffsetX;
      //   offsetX.value = clamp(newOffsetX, -100, 100); // Clamp the offsetX value
      //   }
    })
    .onEnd(() => {
      console.log('==== End Pan ====');

      lastScale.value = scale.value;
      lastFocalX.value = focalX.value;

      const leftBoundary =
        -getPositionWl(0, tickInterval, focalX.value, scale.value, 0) +
        startOffset;
      const rightBoundary =
        getPositionWl(nbTicks - 1, tickInterval, focalX.value, scale.value, 0) +
        startOffset;
      /**
       * Sliding from left to right, the offset will be negative
       * ====>, -
       * Sliding from right to left, the offset will be positive
       * <====, +
       */
      let newOffset;
      if (scale.value === 1) {
        newOffset = startOffset;
      } else if (offsetX.value - leftBoundary > 0) {
        console.log(
          `Left Boundary reached ${offsetX.value - leftBoundary} > 0`
        );
        newOffset = leftBoundary;
      } else if (rightBoundary + offsetX.value < axisWidth) {
        console.log(
          `Right Boundary reached ${offsetX.value - leftBoundary} > 0`
        );
        newOffset = axisWidth - rightBoundary - startOffset;
      } else {
        newOffset = offsetX.value;
      }
      if (newOffset === undefined) throw new Error('newOffset is undefined');
      offsetX.value = withTiming(newOffset, { duration: 300 });
      lastOffsetX.value = newOffset;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      //   console.log({
      //     focalX: event.focalX,
      //     scale: event.scale,
      //     lastScale: lastScale.value,
      //   });
      const newScale = lastScale.value * event.scale;
      scale.value = clamp(newScale, 1, Infinity); // Clamp the scale value

      //   scale.value = lastScale.value * event.scale;
      //   focalX.value = event.focalX;
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
    tickInterval,
  };
};
