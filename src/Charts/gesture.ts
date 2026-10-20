import { clamp } from 'react-native-skia';
import { useCallback, useRef } from 'react';
import {
  usePanGesture,
  usePinchGesture,
  useTapGesture,
  type PanGesture,
  type PinchGesture,
  type TapGesture,
} from 'react-native-gesture-handler';
import {
    useAnimatedReaction,
    useSharedValue,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { DataPoint } from './types';

// Horizontal travel before a scrollable pan takes over, vertical travel before it gives up
const SCROLLABLE_OFFSET = 10;

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

/**
 * Offset range keeping the content edges pinned to the viewport:
 * leftBound (position 0) <= startOffset and rightBound (position width)
 * >= width + startOffset. Collapses to [startOffset, startOffset] at scale 1.
 */
export const getOffsetBoundsWl = function (
  width: number,
  startOffset: number,
  focalX: number,
  scale: number
): [min: number, max: number] {
  'worklet';
  const maxOffset = startOffset + focalX * (scale - 1);
  const minOffset = startOffset + (1 - scale) * (width - focalX);
  return [minOffset, maxOffset];
};

export type Zoom = { scale: number; focalX: number; offsetX: number };

/**
 * Zoom showing positions `from`..`to` across the whole width, clamped to scale >= 1 and to the content.
 */
export const getRangeZoomWl = function (
  width: number,
  startOffset: number,
  from: number,
  to: number
): Zoom {
  'worklet';
  const span = Math.min(Math.max(to - from, 0), width);
  if (span <= 0 || width <= 0)
    return { scale: 1, focalX: 0, offsetX: startOffset };
  const scale = width / span;
  const [minOffset, maxOffset] = getOffsetBoundsWl(width, startOffset, 0, scale);
  const offsetX = clamp(startOffset - from * scale, minOffset, maxOffset);
  return { scale, focalX: 0, offsetX };
};

export type AxisGestureProps = {
  width: number;
  startOffset?: number;
  startScale?: number;
  /**
   * Inside a vertical scroll view: the one-finger pan only takes over on a horizontal drag
   * and lets vertical drags scroll. Defaults to false.
   */
  scrollable?: boolean;
  /** Called on the JS thread when a pinch or pan ends, e.g. to turn the zoom into a new data window. */
  onEnd?: () => void;
};

export type ScalableGesture = {
    scale: SharedValue<number>;
    focalX: SharedValue<number>;
    pinchGesture: PinchGesture;
    panGesture: PanGesture;
    offsetX: SharedValue<number>;
    reset: () => void;
    /** Applies a zoom as if a gesture had ended on it, so the next pinch or pan continues from it. */
    setZoom: (zoom: Zoom) => void;
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
  // Pinch pivot bookkeeping (see pinchGesture)
  const needsPivot = useSharedValue(true);

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

  const setZoom = useCallback(
    (zoom: Zoom) => {
      const newScale = Math.max(zoom.scale, 1);
      const [minOffset, maxOffset] = getOffsetBoundsWl(
        width,
        startOffset,
        zoom.focalX,
        newScale
      );
      const newOffset = clamp(zoom.offsetX, minOffset, maxOffset);
      scale.value = newScale;
      lastScale.value = newScale;
      focalX.value = zoom.focalX;
      lastFocalX.value = zoom.focalX;
      offsetX.value = newOffset;
      lastOffsetX.value = newOffset;
    },
    [
      focalX,
      lastFocalX,
      lastOffsetX,
      lastScale,
      offsetX,
      scale,
      startOffset,
      width,
    ]
  );

  const scrollable = props.scrollable ?? false;
  const onEnd = props.onEnd;
  const commit = () => {
    'worklet';
    lastScale.value = scale.value;
    lastFocalX.value = focalX.value;
    lastOffsetX.value = offsetX.value;
    if (onEnd) scheduleOnRN(onEnd);
  };

  const panGesture = usePanGesture({
    // Single-finger only: two fingers belong to the pinch, whose focal
    // rebase would otherwise fight the pan over offsetX
    maxPointers: 1,
    // No spread here: the worklets plugin can't workletize spread hook configs
    activeOffsetX: scrollable ? [-SCROLLABLE_OFFSET, SCROLLABLE_OFFSET] : undefined,
    failOffsetY: scrollable ? [-SCROLLABLE_OFFSET, SCROLLABLE_OFFSET] : undefined,
    // Incremental deltas (changeX) with a live clamp keep the content
    // edges pinned: no overscroll, no snap-back to interrupt
    onUpdate: (event) => {
      'worklet';
      const [minOffset, maxOffset] = getOffsetBoundsWl(
        width,
        startOffset,
        focalX.value,
        scale.value
      );
      offsetX.value = clamp(
        offsetX.value + event.changeX,
        minOffset,
        maxOffset
      );
    },
    onDeactivate: commit,
  });

  const pinchGesture = usePinchGesture({
    onActivate: () => {
      'worklet';
      needsPivot.value = true;
    },
    onUpdate: (event) => {
      'worklet';
      // The pinch can keep firing in the single-finger tail of the
      // gesture, tracking the remaining finger as its focal: ignore it
      // (numberOfPointers is missing on web — let those through)
      if ((event.numberOfPointers ?? 2) < 2) {
        needsPivot.value = true;
        return;
      }
      const prevScale = scale.value;
      const newScale = clamp(lastScale.value * event.scale, 1, Infinity);
      if (needsPivot.value) {
        // New pivot: rebase offsetX so re-anchoring under the fingers
        // doesn't shift the content
        const rebased =
          offsetX.value + (focalX.value - event.focalX) * (1 - prevScale);
        offsetX.value = (rebased * newScale) / prevScale;
        needsPivot.value = false;
      } else {
        // Keep the content glued to both fingers: the offset follows the
        // focal translation and rescales with the zoom
        offsetX.value =
          (event.focalX - focalX.value + offsetX.value / prevScale) *
          newScale;
      }
      focalX.value = event.focalX;
      scale.value = newScale;
      // Zooming moves the bounds: keep the content edges pinned
      const [minOffset, maxOffset] = getOffsetBoundsWl(
        width,
        startOffset,
        focalX.value,
        scale.value
      );
      offsetX.value = clamp(offsetX.value, minOffset, maxOffset);
    },
    onDeactivate: commit,
  });

  return {
    scale,
    focalX,
    pinchGesture,
    panGesture,
    offsetX,
    reset,
    setZoom,
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

  // Stable dispatcher so an inline onScaleChange doesn't re-register the
  // reaction (and disturb the UI thread) on every render
  const onScaleChangeRef = useRef(onScaleChange);
  onScaleChangeRef.current = onScaleChange;
  const dispatchScaleChange = useCallback((index: number) => {
    onScaleChangeRef.current?.(index);
  }, []);

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
          scheduleOnRN(dispatchScaleChange, i);
          break;
        }
      }
    },
    [scales, dispatchScaleChange]
  );

  return { currentIndex };
};

export type UseCursorGestureProps = {
  width: number;
  height: number;
  points?: SharedValue<DataPoint[]>;
  closestDataPoint?: SharedValue<DataPoint>;
  isContinuous?: boolean;
  /**
   * Inside a vertical scroll view: the pan only starts on a horizontal drag and lets
   * vertical drags scroll, and taps don't move the cursor. Defaults to false.
   */
  scrollable?: boolean;
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
    scrollable = false,
  } = props;

  if (!isContinuous && points === undefined)
    console.warn('Points must be defined for non-continuous mode');

  const xPosition = useSharedValue(0);
  const yPosition = useSharedValue(height);
  /** True while a finger drives the cursor. */
  const isActive = useSharedValue(false);

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
  const start = (event: { x: number; y: number }) => {
    'worklet';
    isActive.value = true;
    setPosition(event.x, event.y);
  };

  const panGesture: PanGesture = usePanGesture({
    activeOffsetX: scrollable ? [-SCROLLABLE_OFFSET, SCROLLABLE_OFFSET] : undefined,
    failOffsetY: scrollable ? [-SCROLLABLE_OFFSET, SCROLLABLE_OFFSET] : undefined,
    // onBegin fires on any touch, even one that ends up scrolling
    onBegin: scrollable ? undefined : start,
    onActivate: scrollable ? start : undefined,
    onUpdate: (event) => {
      'worklet';
      setPosition(event.x, event.y);
    },
    onFinalize: () => {
      'worklet';
      isActive.value = false;
    },
  });
  const tapGesture: TapGesture = useTapGesture({
    onBegin: (event) => {
      'worklet';
      setPosition(event.x, event.y);
    },
  });

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

  return { panGesture, tapGesture, xPosition, yPosition, isActive };
};
