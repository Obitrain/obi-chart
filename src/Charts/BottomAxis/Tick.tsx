import {
  Group,
  Line,
  Text,
  vec,
  type Color,
  type SkFont,
} from '@shopify/react-native-skia';
import { memo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { getPositionWl } from '../gesture';

export type TickProps = {
  initPosition: number;
  label: string;
  scale: SharedValue<number>;
  focalX: SharedValue<number>;
  offsetX: SharedValue<number>;
  offsetY?: number;
  font: SkFont;
  color?: Color;
  labelColor?: Color;
  /** Length of the tick line. Use a negative value (e.g. -chartHeight) to draw a vertical gridline above the axis. */
  tickLength?: number;
  strokeWidth?: number;
  showLabel?: boolean;
};

// Memoized: zoom/pan flows through shared values, so a Tick only needs to
// re-render when its label or base position changes
export const Tick = memo(function Tick(props: TickProps) {
  const {
    label,
    scale,
    focalX,
    offsetX,
    initPosition,
    font,
    color = 'black',
    labelColor,
    tickLength = 10,
    strokeWidth,
    showLabel = true,
  } = props;
  const offsetY = props.offsetY ?? 0;
  const transform = useDerivedValue(() => [
    {
      translateX: getPositionWl(
        initPosition,
        focalX.value,
        scale.value,
        offsetX.value
      ),
    },
  ]);
  const width = font
    .getGlyphWidths(font.getGlyphIDs(label))
    .reduce((a, b) => a + b, 0);

  return (
    <Group transform={transform}>
      <Line
        color={color}
        strokeWidth={strokeWidth}
        p1={vec(0, offsetY)}
        p2={vec(0, offsetY + tickLength)}
      />
      {showLabel ? (
        <Text
          text={label}
          color={labelColor ?? color}
          x={-width / 2}
          y={offsetY + 23}
          font={font}
        />
      ) : null}
    </Group>
  );
});
