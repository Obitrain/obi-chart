import {
  Group,
  Line,
  Text,
  vec,
  type Color,
  type SkFont,
} from '@shopify/react-native-skia';
import React, { type FC } from 'react';

export type Props = {
  height: number;
  width: number;
  nbLines?: number;
  font: SkFont;
  color?: Color;
  minY: number;
  maxY: number;
};

const YAxis: FC<Props> = function (props) {
  const {
    height,
    width,
    font,
    nbLines = 4,
    color = 'black',
    minY,
    maxY,
  } = props;
  //   const minPointY = Math.min(...dataPoints.map((x) => x.y));
  //   const maxPointY = Math.max(...dataPoints.map((x) => x.y));
  //   const minPoint = dataPoints.find((x) => x.y === minPointY);
  //   const maxPoint = dataPoints.find((x) => x.y === maxPointY);
  //   console.log({ maxPointY, minPointY, minPoint, maxPoint });

  const step = height / nbLines;

  return (
    <Group color={color}>
      {Array.from({ length: nbLines }).map((_x, i) => {
        const y = height - (i + 1) * step;
        console.log(y);
        const label = `${Math.ceil(
          ((height - y) * (maxY - minY)) / height + minY
        )}`;
        const labelWidth = font
          .getGlyphWidths(font.getGlyphIDs(label))
          .reduce((a, b) => a + b, 0);

        return (
          <Group key={`YLabel-${i}`} transform={[{ translateY: y }]}>
            <Line key={i} p1={vec(0, 0)} p2={vec(width - 10 - labelWidth, 0)} />
            <Text
              text={label}
              x={width - 10 - labelWidth}
              y={font.getSize() / 2.5}
              font={font}
            />
          </Group>
        );
      })}
    </Group>
  );
};

export { YAxis };
