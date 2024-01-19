import { Line, vec, type Color } from '@shopify/react-native-skia';
import React, { type FC } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { getPositionWl } from '../gesture';

export type Props = {
  width: number;
  offsetY: number;
  focalX: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
  offsetX: Animated.SharedValue<number>;
  strokeWidth?: number;
  color?: Color;
};

const AxisLine: FC<Props> = function (props) {
  const {
    width,
    offsetY,
    focalX,
    scale,
    offsetX,
    strokeWidth = StyleSheet.hairlineWidth,
    color = 'black',
  } = props;
  const p1 = useDerivedValue(() => {
    const p1X = getPositionWl(0, focalX.value, scale.value, offsetX.value);
    return vec(p1X, offsetY);
  }, []);

  const p2 = useDerivedValue(() => {
    const p1X = getPositionWl(width, focalX.value, scale.value, offsetX.value);
    return vec(p1X, offsetY);
  }, [width]);

  return <Line {...{ p1, p2, color, strokeWidth }} />;
};

export { AxisLine };
