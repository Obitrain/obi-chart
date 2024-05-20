import type { SharedValue } from 'react-native-reanimated';
import type { GraphData } from './graphUtils';

export type LineGraphType = GraphData; // Omit<GraphData, 'path'> & { path: RPath };

export type DataPoint = {
  x: number;
  y: number;
  value: number;
};

export type AnimatedDot = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  opacity: SharedValue<number>;
};
