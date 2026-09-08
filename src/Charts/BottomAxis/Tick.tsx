import {
  DashPathEffect,
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
  /** Dash/gap lengths for a dashed tick line. */
  dash?: [number, number];
  showLabel?: boolean;
  /** `center` puts the label under the tick, `left` starts it right after the tick. */
  labelAlign?: 'center' | 'left';
  /** Gap between the tick and a left-aligned label. */
  labelGap?: number;
};

const TickComponent = function (props: TickProps) {
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
    dash,
    showLabel = true,
    labelAlign = 'center',
    labelGap = 6,
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
  const labelX = labelAlign === 'left' ? labelGap : -width / 2;

  return (
    <Group transform={transform}>
      <Line
        color={color}
        strokeWidth={strokeWidth}
        p1={vec(0, offsetY)}
        p2={vec(0, offsetY + tickLength)}
      >
        {dash !== undefined ? <DashPathEffect intervals={dash} /> : null}
      </Line>
      {showLabel ? (
        <Text
          text={label}
          color={labelColor ?? color}
          x={labelX}
          y={offsetY + 23}
          font={font}
        />
      ) : null}
    </Group>
  );
};

// Memoized: zoom/pan flows through shared values, so a Tick only needs to
// re-render when its label or base position changes
export const Tick = memo(TickComponent);
Tick.displayName = 'Tick';
