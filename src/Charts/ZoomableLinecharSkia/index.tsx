import { Canvas, type SkPath } from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { SharedValue } from 'react-native-reanimated';
import { Line } from './Line';

export { Line };

export type ZoomableLineChartProps = {
  height: number;
  width: number;
  offsetX: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;

  style?: StyleProp<ViewStyle>;
  path: SharedValue<SkPath>;
  children?: React.ReactNode;
  color?: string;
};

const ZoomableLineChart: FC<ZoomableLineChartProps> = function (props) {
  const { width, height, style, children, ...rest } = props;

  return (
    <Canvas
      style={[
        {
          width,
          height,
        },
        style,
      ]}
    >
      <Line {...rest} />
      {children}
    </Canvas>
  );
};

export { ZoomableLineChart };
