import {
  Group,
  Line,
  Text,
  vec,
  type Color,
  type SkFont,
} from 'react-native-skia';
import { memo, useMemo, type FC } from 'react';
import { StyleSheet } from 'react-native';

export type YAxisProps = {
  width: number;
  height: number;
  font: SkFont;
  minY: number;
  maxY: number;
  /** Values to draw a gridline at. Defaults to `nbTicks` evenly spaced values. */
  values?: number[];
  nbTicks?: number;
  color?: Color;
  labelColor?: Color;
  strokeWidth?: number;
  showLabels?: boolean;
  formatLabel?: (value: number) => string;
  /** `right` (default): label right of a shortened line; `left`: label above the line's left end, line full width. */
  labelAlign?: 'right' | 'left';
};

const defaultFormatLabel = (value: number) => `${Math.round(value)}`;

/** Evenly spaced integer ticks from 0 to a padded maximum, e.g. 0, 26, 52, 78, 104. */
export const getPaddedTicks = function (
  maxValue: number,
  nbTicks = 4,
  padding = 1.15
): number[] {
  const step = Math.max(1, Math.ceil((maxValue * padding) / nbTicks));
  return Array.from({ length: nbTicks + 1 }, (_, i) => i * step);
};

/**
 * Round-number ticks covering [minValue, maxValue] with at most `maxTicks` ticks,
 * stepping by 1, 2, 2.5 or 5 × 10ⁿ, e.g. 94..175 → 75, 100, 125, 150, 175.
 */
export const getNiceTicks = function (
  minValue: number,
  maxValue: number,
  maxTicks = 5
): number[] {
  const segments = Math.max(1, maxTicks - 1);
  const span = maxValue - minValue;
  const raw = span > 0 ? span / segments : Math.abs(maxValue) || 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  // Snapping min/max outwards can add a segment: widen the step until it fits
  for (const factor of [1, 2, 2.5, 5, 10, 20]) {
    const step = factor * magnitude;
    const start = Math.floor(minValue / step);
    const end = Math.max(Math.ceil(maxValue / step), start + 1);
    if (end - start <= segments) {
      // Rounded to the step's precision to drop float noise (0.1 + 0.2)
      const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
      return Array.from({ length: end - start + 1 }, (_, i) =>
        Number(((start + i) * step).toFixed(decimals))
      );
    }
  }
  return [minValue, maxValue];
};

const YAxis: FC<YAxisProps> = function (props) {
  const {
    width,
    height,
    font,
    minY,
    maxY,
    nbTicks = 4,
    color = 'black',
    labelColor,
    strokeWidth = StyleSheet.hairlineWidth,
    showLabels = true,
    formatLabel = defaultFormatLabel,
    labelAlign = 'right',
  } = props;

  // Measured once per input change: parents re-render while panning
  const rows = useMemo(() => {
    // A flat range would divide by zero
    const span = maxY - minY || 1;
    const values =
      props.values ??
      Array.from(
        { length: nbTicks },
        (_, i) => minY + ((i + 1) * (maxY - minY)) / nbTicks
      );
    return values.map((value) => {
      const label = formatLabel(value);
      const labelWidth = font
        .getGlyphWidths(font.getGlyphIDs(label))
        .reduce((a, b) => a + b, 0);
      return {
        label,
        labelWidth,
        transform: [{ translateY: height - ((value - minY) * height) / span }],
        p1: vec(0, 0),
        p2: vec(
          showLabels && labelAlign === 'right' ? width - 10 - labelWidth : width,
          0
        ),
      };
    });
  }, [props.values, nbTicks, minY, maxY, height, width, font, showLabels, formatLabel, labelAlign]);

  return (
    <Group>
      {rows.map((row, i) => (
        <Group key={`YTick-${i}`} transform={row.transform}>
          <Line p1={row.p1} p2={row.p2} color={color} strokeWidth={strokeWidth} />
          {showLabels ? (
            <Text
              text={row.label}
              x={labelAlign === 'right' ? width - row.labelWidth : 2}
              y={labelAlign === 'right' ? font.getSize() / 2.5 : -3}
              font={font}
              color={labelColor ?? color}
            />
          ) : null}
        </Group>
      ))}
    </Group>
  );
};

const MemoYAxis = memo(YAxis);
MemoYAxis.displayName = 'YAxis';

export { MemoYAxis as YAxis };
