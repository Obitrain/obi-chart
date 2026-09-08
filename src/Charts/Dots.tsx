import { Path, Skia, type Color } from '@shopify/react-native-skia';
import { type FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { getPositionWl } from './gesture';
import type { AnimatedDot } from './types';

export type DotShape = 'circle' | 'diamond';

export type DotsProps = {
  dots: AnimatedDot[];
  r?: number;
  shape?: DotShape;
  color?: Color;
  /** When set, dots are drawn as rings: `fillColor` inside, `color` as the stroke. */
  fillColor?: Color;
  strokeWidth?: number;
  /** Viewport width used to cull off-screen dots. */
  width?: number;
  // Optional zoom/pan awareness (see useScalableGesture)
  scale?: SharedValue<number>;
  focalX?: SharedValue<number>;
  offsetX?: SharedValue<number>;
};

/**
 * Draw a whole series of dots as a single Skia path (two with `fillColor`).
 * Unlike mapping over {@link Dot}, this runs one worklet per frame instead of
 * one per dot, which keeps large series smooth during zoom/pan gestures.
 * Per-dot opacity is binary here: dots below 0.5 are hidden.
 */
const Dots: FC<DotsProps> = function (props) {
  const {
    dots,
    r = 4,
    shape = 'circle',
    color = 'black',
    fillColor,
    strokeWidth = 2,
    width,
    scale,
    focalX,
    offsetX,
  } = props;

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const margin = r + strokeWidth;
    for (const dot of dots) {
      if (dot.opacity.value < 0.5) continue;
      const x =
        scale === undefined || focalX === undefined || offsetX === undefined
          ? dot.x.value
          : getPositionWl(
              dot.x.value,
              focalX.value,
              scale.value,
              offsetX.value
            );
      if (width !== undefined && (x < -margin || x > width + margin)) continue;
      const y = dot.y.value;
      if (shape === 'diamond') {
        // One addPoly beats four moveTo/lineTo calls: each is a JSI hop, and
        // this worklet rebuilds every dot on every frame of a gesture
        p.addPoly(
          [
            { x, y: y - r },
            { x: x + r, y },
            { x, y: y + r },
            { x: x - r, y },
          ],
          true
        );
      } else {
        p.addCircle(x, y, r);
      }
    }
    return p;
  });

  return (
    <>
      <Path path={path} color={fillColor ?? color} />
      {fillColor !== undefined ? (
        <Path
          path={path}
          style="stroke"
          color={color}
          strokeWidth={strokeWidth}
          strokeJoin="round"
        />
      ) : null}
    </>
  );
};

export { Dots };
