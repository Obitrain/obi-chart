import { Canvas, Group, type SkPath } from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { SharedValue } from 'react-native-reanimated';
import { ScalablePath } from './ScalablePath';

export { ScalablePath };

export type ZoomableLineChartProps = {
  height: number;
  width: number;
  offsetX: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;
  offsetY?: number;

  style?: StyleProp<ViewStyle>;
  path: SharedValue<SkPath>;
  children?: React.ReactNode;
  color?: string;
};

const ZoomableLineChart: FC<ZoomableLineChartProps> = function (props) {
  const { width, height, style, children, offsetY = 0, ...rest } = props;

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
      <Group transform={[{ translateY: offsetY }]}>
        <ScalablePath {...rest} />
        {children}
      </Group>
    </Canvas>
  );
};

export { ZoomableLineChart };
