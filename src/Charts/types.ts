import type { GraphData } from './graphUtils';

export type DataPoint = {
  x: number;
  y: number;
};

export type LineGraphType = GraphData; // Omit<GraphData, 'path'> & { path: RPath };
