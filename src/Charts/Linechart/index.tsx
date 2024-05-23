import { Canvas, Group, Path, type PathDef } from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export type LinePath = {
  path: PathDef | SharedValue<PathDef>;
  color: string;
  id?: string;
};

export type LineChartProps = {
  path?: PathDef | SharedValue<PathDef>;
  paths?: LinePath[];
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
    paths,
    offsetX = 0,
    offsetY = 0,
  } = props;

  const _paths: LinePath[] =
    paths !== undefined
      ? paths
      : path !== undefined
      ? [{ path: path, color: color ?? 'red' }]
      : [];
  if (_paths.length === 0) {
    console.warn('Specify either a path or multiple paths.');
    return null;
    // throw new Error('Specify either a path or multiple paths.');
  }
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
        {_paths.map((_path, i) => (
          <Path
            key={`${_path.id ?? i}`}
            style="stroke"
            {..._path}
            strokeWidth={2}
            strokeJoin="round"
            strokeCap="round"
          />
        ))}
        {children}
      </Group>
    </Canvas>
  );
};

export { LineChart };
