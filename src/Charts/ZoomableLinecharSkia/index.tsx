import {
  Canvas,
  Group,
  Path,
  Skia,
  type AnimatedProp,
  type PathCommand,
  type Transforms2d,
} from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { buildGraph, type Config, type GraphData } from '../utils';
import { serializeScale, useZoomableChart } from './utils';

export type DataPoint = {
  x: number;
  y: number;
};

export type LineGraphType = GraphData; // Omit<GraphData, 'path'> & { path: RPath };

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

export type ZoomableLineChartProps = {
  line: LineItem;
  height: number;
  width: number;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  config?: Config;
  showCursor?: boolean;
  lineColor?: string;
  currentPosition?: PositionType;
  children?: React.ReactNode;
};

const ZoomableLineChart: FC<ZoomableLineChartProps> = function ({
  line,
  width,
  height,
  style,
  containerStyle,
  config,
  //   children,
}) {
  const graph = buildGraph(
    line.data.map((p) => [p.x, p.y]),
    width,
    height,
    line.config ?? config
  );
  const path = Skia.Path.MakeFromSVGString(graph.path);

  console.log(graph.path);

  const commands = useSharedValue<PathCommand[]>([]);

  if (path == null || typeof path === 'string')
    throw new Error('Path not found');

  commands.value = path.toCmds();

  const {
    scale,
    translateX,
    // focalX,
    // scaleOffset,
    // translateNorm,
    pinchGesture,
    panGesture,
    // reset,
  } = useZoomableChart({ width });

  const transform = useDerivedValue<
    AnimatedProp<Transforms2d | undefined, any>
  >(() => {
    return [{ translateX: translateX.value }];
  }, [translateX]);

  const animatedPath = useDerivedValue(() => {
    const _path = Skia.Path.MakeFromCmds(serializeScale(commands.value, scale));
    console.log(JSON.stringify({ path: _path?.toSVGString() }, null, 2));
    return _path?.toSVGString();
  }, [scale]);

  const composedGesture = Gesture.Race(pinchGesture, panGesture);

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
        <Group transform={transform}>
          <Path
            style="stroke"
            path={animatedPath}
            strokeWidth={2}
            //   strokeJoin="round"
            //   strokeCap="round"
            color="red"
          />
        </Group>

        {/* <Cursor x={xPosition} {...{ y, width }} color={lines[0]?.color!} /> */}
      </Canvas>
      <GestureDetector
        gesture={composedGesture}
        // onGestureEvent={onPinchEvent}
      >
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
          }}
        />
      </GestureDetector>
    </View>
  );
};

export { ZoomableLineChart };
