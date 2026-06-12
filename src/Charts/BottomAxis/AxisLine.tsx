import { Line, vec, type Color } from '@shopify/react-native-skia';
import { type FC } from 'react';
import { StyleSheet } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { getPositionWl } from '../gesture';

export type AxisLineProps = {
  width: number;
  focalX: SharedValue<number>;
  scale: SharedValue<number>;
  offsetX: SharedValue<number>;
  strokeWidth?: number;
  offsetY?: number;
  color?: Color;
};

const AxisLine: FC<AxisLineProps> = function (props) {
  const {
    width,
    focalX,
    scale,
    offsetX,
    offsetY = 0,
    strokeWidth = StyleSheet.hairlineWidth,
    color = 'black',
  } = props;
  const p1 = useDerivedValue(() => {
    const p1X = getPositionWl(0, focalX.value, scale.value, offsetX.value);
    return vec(p1X, offsetY);
  });

  const p2 = useDerivedValue(() => {
    const p2X = getPositionWl(width, focalX.value, scale.value, offsetX.value);
    return vec(p2X, offsetY);
  });

  return <Line {...{ p1, p2, color, strokeWidth }} />;
};

export { AxisLine };
