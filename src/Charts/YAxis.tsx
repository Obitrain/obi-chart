import {
  Group,
  Line,
  Text,
  vec,
  type Color,
  type SkFont,
} from '@shopify/react-native-skia';
import { type FC } from 'react';
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
};

const defaultFormatLabel = (value: number) => `${Math.round(value)}`;

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
  } = props;

  const values =
    props.values ??
    Array.from(
      { length: nbTicks },
      (_, i) => minY + ((i + 1) * (maxY - minY)) / nbTicks
    );

  return (
    <Group>
      {values.map((value, i) => {
        const y = height - ((value - minY) * height) / (maxY - minY);
        const label = formatLabel(value);
        const labelWidth = font
          .getGlyphWidths(font.getGlyphIDs(label))
          .reduce((a, b) => a + b, 0);
        const lineWidth = showLabels ? width - 10 - labelWidth : width;

        return (
          <Group key={`YTick-${i}`} transform={[{ translateY: y }]}>
            <Line
              p1={vec(0, 0)}
              p2={vec(lineWidth, 0)}
              color={color}
              strokeWidth={strokeWidth}
            />
            {showLabels ? (
              <Text
                text={label}
                x={width - labelWidth}
                y={font.getSize() / 2.5}
                font={font}
                color={labelColor ?? color}
              />
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
};

export { YAxis };
