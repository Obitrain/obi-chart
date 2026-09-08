import { Circle, Group, type Color } from '@shopify/react-native-skia';
import { memo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { getPositionWl } from './gesture';

export type DotProps = {
  x: SharedValue<number> | number;
  y: SharedValue<number> | number;
  opacity?: SharedValue<number> | number;
  r?: number;
  color?: Color;
  /**
   * When set, the dot is drawn as a ring: `fillColor` inside, `color` as the
   * stroke. Use the chart background color to get a "hollow" marker.
   */
  fillColor?: Color;
  strokeWidth?: number;
  // Optional zoom/pan awareness (see useScalableGesture)
  scale?: SharedValue<number>;
  focalX?: SharedValue<number>;
  offsetX?: SharedValue<number>;
};

function DotComponent(props: DotProps) {
  const {
    x,
    y,
    opacity = 1,
    r = 4,
    color = 'black',
    fillColor,
    strokeWidth = 2,
    scale,
    focalX,
    offsetX,
  } = props;

  const cx = useDerivedValue(() => {
    const _x = typeof x === 'number' ? x : x.value;
    if (scale === undefined || focalX === undefined || offsetX === undefined)
      return _x;
    return getPositionWl(_x, focalX.value, scale.value, offsetX.value);
  });

  return (
    <Group opacity={opacity}>
      <Circle cx={cx} cy={y} r={r} color={fillColor ?? color} />
      {fillColor !== undefined ? (
        <Circle
          cx={cx}
          cy={y}
          r={r}
          style="stroke"
          color={color}
          strokeWidth={strokeWidth}
        />
      ) : null}
    </Group>
  );
}

// Memoized: charts render many dots and the position updates flow through
// shared values, so parent re-renders don't need to reach them
export const Dot = memo(DotComponent);
