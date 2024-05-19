import { Group, Line, Text, matchFont, vec } from '@shopify/react-native-skia';
import React from 'react';
import { Platform } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { getPositionWl } from '../gesture';

type TickProps = {
  initPosition: number;
  label: string;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;
  offsetX: Animated.SharedValue<number>;
  offsetY?: number;
};

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });

const font = matchFont({ fontFamily, fontSize: 14 });

export const Tick: React.FC<TickProps> = (props) => {
  const { label, scale, focalX, offsetX, initPosition } = props;
  const offsetY = props.offsetY ?? 0;
  const transform = useDerivedValue(
    () => [
      {
        translateX: getPositionWl(
          initPosition,
          focalX.value,
          scale.value,
          offsetX.value
        ),
      },
    ],
    [initPosition, offsetX]
  );
  const width = font
    .getGlyphWidths(font.getGlyphIDs(label))
    .reduce((a, b) => a + b, 0);

  return (
    <Group transform={transform}>
      <Line color="black" p1={vec(0, offsetY)} p2={vec(0, offsetY + 10)} />
      <Text
        text={label}
        color="black"
        x={-width / 2}
        y={offsetY + 23}
        font={font}
      />
    </Group>
  );
};
