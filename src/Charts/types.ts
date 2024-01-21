import type Animated from 'react-native-reanimated';
import type { GraphData } from './graphUtils';

export type LineGraphType = GraphData; // Omit<GraphData, 'path'> & { path: RPath };

export type DataPoint = {
  x: number;
  y: number;
  value: number;
};

export type AnimatedDot = {
  x: Animated.SharedValue<number>;
  y: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
};
