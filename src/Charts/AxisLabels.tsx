import { Group, Text, type Color, type SkFont } from 'react-native-skia';
import { memo, useMemo, type FC } from 'react';

export type AxisLabelsProps = {
  /** Values to label, e.g. from `getAlignedTicks`. */
  values: number[];
  minY: number;
  maxY: number;
  height: number;
  width: number;
  font: SkFont;
  color?: Color;
  /** Edge the labels hug: `left` aligns their start to 0, `right` their end to `width`. */
  side?: 'left' | 'right';
  formatLabel?: (value: number) => string;
};

const defaultFormatLabel = (value: number) => `${value}`;

/**
 * Tick labels alone, vertically centred on each value. Pair with a label-less `YAxis`
 * to give a second series its own scale on the other side of the same gridlines.
 */
const AxisLabels: FC<AxisLabelsProps> = function ({
  values,
  minY,
  maxY,
  height,
  width,
  font,
  color = 'black',
  side = 'right',
  formatLabel = defaultFormatLabel,
}) {
  const labels = useMemo(() => {
    // A flat range would divide by zero
    const span = maxY - minY || 1;
    return values.map((value) => {
      const text = formatLabel(value);
      const textWidth = font
        .getGlyphWidths(font.getGlyphIDs(text))
        .reduce((a, b) => a + b, 0);
      return {
        text,
        x: side === 'left' ? 0 : width - textWidth,
        y: height - ((value - minY) * height) / span + font.getSize() / 2.5,
      };
    });
  }, [values, minY, maxY, height, width, font, side, formatLabel]);

  return (
    <Group>
      {labels.map((label, i) => (
        <Text
          key={`AxisLabel-${i}`}
          text={label.text}
          x={label.x}
          y={label.y}
          font={font}
          color={color}
        />
      ))}
    </Group>
  );
};

const MemoAxisLabels = memo(AxisLabels);
MemoAxisLabels.displayName = 'AxisLabels';

export { MemoAxisLabels as AxisLabels };
