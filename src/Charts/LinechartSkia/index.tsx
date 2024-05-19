import { Canvas, Group, Path, type SkPath } from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { SharedValue } from 'react-native-reanimated';
import { type Config, type GraphData } from '../graphUtils';
import type { DataPoint } from '../types';

export type LineItem = {
  data: DataPoint[];
  color?: string;
  config?: Config;
  currentValue?: Animated.SharedValue<number>;
};

export type PositionType = {
  x: Animated.SharedValue<number>;
  y: Animated.SharedValue<number>;
};

export type GraphDataSkia = Omit<GraphData, 'path'> & { path: SkPath };

export type LineChartProps = {
  path: SharedValue<SkPath>;
  height: number;
  width: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
  offsetY?: number;
  offsetX?: number;
};

const LineChart: FC<LineChartProps> = function (props) {
  const {
    width,
    height,
    style,
    path,
    children,
    color,
    offsetX = 0,
    offsetY = 0,
  } = props;

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
      <Group transform={[{ translateY: offsetY }, { translateX: offsetX }]}>
        <Path
          style="stroke"
          path={path}
          strokeWidth={2}
          strokeJoin="round"
          strokeCap="round"
          color={color}
        />
        {children}
      </Group>
    </Canvas>
  );
};

export { LineChart };
