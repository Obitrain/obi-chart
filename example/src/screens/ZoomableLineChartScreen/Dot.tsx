import { Circle, Paint } from '@shopify/react-native-skia';
import { getPositionWl } from 'obi-chart';
import React, { type FC } from 'react';
import type Animated from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

export type Props = {
  x: Animated.SharedValue<number>;
  y: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;
  offsetX: Animated.SharedValue<number>;
};

const Dot: FC<Props> = function (props) {
  const { y, opacity, scale, focalX, offsetX } = props;

  const x = useDerivedValue(() => {
    return getPositionWl(
      props.x.value,
      focalX.value,
      scale.value,
      offsetX.value
    );
  }, []);

  return (
    <Circle cx={x} cy={y} r={5} opacity={opacity}>
      <Paint color="white" />
    </Circle>
  );
};

export { Dot };
