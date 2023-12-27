import {
  Canvas,
  Path,
  Skia,
  clamp,
  type PathCommand,
} from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import type { DataPoint } from '../types';
import { buildGraph, type Config } from '../utils';
import { Cursor } from './Cursor';

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

export type LineChartProps = {
  lines: LineItem[];
  height: number;
  width: number;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  config?: Config;
};

const LineChart: FC<LineChartProps> = function ({
  lines,
  width,
  height,
  style,
  containerStyle,
  config,
}) {
  const _graphs = lines.map((x) => {
    const { path, ...rest } = buildGraph(
      x.data.map((p) => [p.x, p.y]),
      width,
      height,
      x.config ?? config
    );
    return { path: Skia.Path.MakeFromSVGString(path), ...rest };
  });

  const commands = useSharedValue<PathCommand[]>([]);

  const path = _graphs[0]?.path;
  if (path == null || typeof path === 'string')
    throw new Error('Path not found');

  const xPosition = useSharedValue(0);
  const yPosition = useSharedValue(height);

  commands.value = path.toCmds();

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      xPosition.value = clamp(event.x, 0, width);
      yPosition.value = clamp(event.y, 0, height);
    })
    .onUpdate((event) => {
      xPosition.value = clamp(event.x, 0, width);
      yPosition.value = clamp(event.y, 0, height);
    });

  return (
    <View style={[containerStyle]}>
      <Canvas
        style={[
          {
            width,
            height,
          },
          style,
        ]}
      >
        <Path
          style="stroke"
          path={path}
          strokeWidth={2}
          //   strokeJoin="round"
          //   strokeCap="round"
          color="red"
        />

        {/* <Cursor x={xPosition} {...{ y, width }} color={lines[0]?.color!} /> */}
      </Canvas>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
          }}
        >
          <Cursor
            cmds={commands}
            maxWidth={width}
            positionX={xPosition}
            color={lines[0]?.color}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export { LineChart };
