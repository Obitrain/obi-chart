import {
  Canvas,
  Group,
  Path,
  clamp,
  type SkPath,
} from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { useSharedValue } from 'react-native-reanimated';
import type { DataPoint } from '../types';
import {
  getClosestPoint,
  type Config,
  type Dot,
  type GraphData,
} from '../utils';
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

export type GraphDataSkia = Omit<GraphData, 'path'> & { path: SkPath };

export type LineChartProps = {
  path: SharedValue<SkPath>;
  points: Dot[];
  height: number;
  width: number;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  continuous?: boolean;
  currentValue?: Animated.SharedValue<number>;
  color?: string;
};

const LineChart: FC<LineChartProps> = function (props) {
  const {
    width,
    height,
    style,
    path,
    containerStyle,
    continuous = true,
    currentValue,
    children,
    color,
    points,
  } = props;

  const commands = useDerivedValue(() => {
    return path.value.toCmds();
  }, []);

  const xPosition = useSharedValue(0);
  const yPosition = useSharedValue(height);

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      xPosition.value = clamp(event.x, 0, width);
      yPosition.value = clamp(event.y, 0, height);
    })
    .onUpdate((event) => {
      xPosition.value = clamp(event.x, 0, width);
      yPosition.value = clamp(event.y, 0, height);
    });

  const tapGesture = Gesture.Tap().onBegin((event) => {
    xPosition.value = clamp(event.x, 0, width);
    yPosition.value = clamp(event.y, 0, height);
  });

  const padding = 20;

  useDerivedValue(() => {
    if (continuous) return;
    const closestDot = getClosestPoint(xPosition.value, points);
    xPosition.value = closestDot.x;
  }, [xPosition, continuous]);

  return (
    <View style={[containerStyle]}>
      <Canvas
        style={[
          {
            width,
            height: height + padding,
          },
          style,
        ]}
      >
        <Group transform={[{ translateY: padding / 2 }]}>
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
      <GestureDetector gesture={continuous ? panGesture : tapGesture}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            marginTop: padding / 2,
          }}
        >
          <Cursor
            cmds={commands}
            maxWidth={width}
            positionX={xPosition}
            color={'blue'}
            currentValue={currentValue}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export { LineChart };
