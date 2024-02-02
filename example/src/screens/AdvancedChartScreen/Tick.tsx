import { Group, Line, Text, matchFont, vec } from '@shopify/react-native-skia';
import { getPositionWl } from 'obi-chart';
import React, { type FC } from 'react';
import { Platform } from 'react-native';
import type Animated from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });

const font = matchFont({ fontFamily, fontSize: 14 });

export type Props = {
  initPosition: Animated.SharedValue<number>;
  label: Animated.SharedValue<string>;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;
  offsetX: Animated.SharedValue<number>;
  offsetY?: number;
};

const Tick: FC<Props> = function (props) {
  const { label, scale, focalX, offsetX, initPosition } = props;
  const offsetY = props.offsetY ?? 0;
  const transform = useDerivedValue(
    () => [
      {
        translateX: getPositionWl(
          initPosition.value,
          focalX.value,
          scale.value,
          offsetX.value
        ),
      },
    ],
    [initPosition, offsetX]
  );

  return (
    <Group color={'black'} transform={transform}>
      <Line p1={vec(0, 0)} p2={vec(0, offsetY + 10)} />
      <Text text={label} x={5} y={offsetY + 10} font={font} />
    </Group>
  );
};

export { Tick };
