import { Group, Line, Text, matchFont, vec } from '@shopify/react-native-skia';
import React from 'react';
import { Platform } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated';

type TickProps = {
  index: number;
  value: string;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;
  offsetX: Animated.SharedValue<number>;
  tickInterval: number;
  yPosition?: number;
};

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });

const font = matchFont({ fontFamily, fontSize: 14 });

export const getPositionWl = function (
  index: number,
  tickInterval: number,
  focalX: number,
  scale: number,
  offsetX: number
) {
  'worklet';
  //   if (index === 4)
  //     console.log(
  //       'getPositionWl: ',
  //       (index * tickInterval - focalX) * scale + focalX + offsetX
  //     );
  return (index * tickInterval - focalX) * scale + focalX + offsetX;
};

export const Tick: React.FC<TickProps> = (props) => {
  const { value, index, scale, focalX, offsetX, tickInterval } = props;
  const yPosition = props.yPosition ?? 0;
  const transform = useDerivedValue(
    () => [
      {
        translateX: getPositionWl(
          index,
          tickInterval,
          focalX.value,
          scale.value,
          offsetX.value
        ),
      },
    ],
    [index, tickInterval, offsetX]
  );
  const width = font
    .getGlyphWidths(font.getGlyphIDs(value))
    .reduce((a, b) => a + b, 0);

  return (
    <Group transform={transform}>
      <Line color="black" p1={vec(0, yPosition)} p2={vec(0, yPosition + 10)} />
      <Text
        text={value}
        color="black"
        x={-width / 2}
        y={yPosition + 23}
        font={font}
      />
    </Group>
  );
};
