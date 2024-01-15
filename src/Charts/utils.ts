import { Skia, type SkPath } from '@shopify/react-native-skia';
import { scaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';

export type Config = {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  // See https://d3js.org/d3-shape/curve
  curve?: shape.CurveFactory | shape.CurveFactoryLineOnly;
};

export type Dot = {
  x: number;
  y: number;
  value: number;
};

export type GraphData = {
  data: [number, number][];
  minY: number;
  maxY: number;
  path: string;
  skiaPath: SkPath;
  dots: Dot[];
};

export const buildGraph = function (
  data: [number, number][],
  width: number,
  height: number,
  config?: Config
): GraphData {
  const minX = config?.minX ?? Math.min(...data.map((x) => x[0]));
  const maxX = config?.maxX ?? Math.max(...data.map((x) => x[0]));
  const scaleX = scaleLinear().domain([minX, maxX]).range([0, width]);

  const minY = config?.minY ?? Math.min(...data.map((x) => x[1]));
  const maxY = config?.maxY ?? Math.max(...data.map((x) => x[1]));
  const scaleY = scaleLinear().domain([minY, maxY]).range([height, 0]);

  const fmtValues = data.map((x) => [x[1], x[0]] as [number, number]);

  const path = shape
    .line()
    .x(([, x]) => scaleX(x))
    .y(([y]) => scaleY(y))
    .curve(config?.curve ?? shape.curveBasis)(fmtValues) as string;

  const dots = fmtValues.map(([y, x]) => ({
    x: scaleX(x),
    y: scaleY(y),
    value: y,
  }));

  const skiaPath = Skia.Path.MakeFromSVGString(path);
  if (skiaPath == null) throw new Error('Path not found');

  return {
    data: fmtValues,
    minY,
    maxY,
    path,
    dots,
    skiaPath,
  };
};

/**
 * Get the closest point to a given x value
 */
export const getClosestPoint = function (x: number, dots: Dot[]): Dot {
  'worklet';
  let closestDot = dots[0];
  if (closestDot === undefined) throw new Error('Dots array cannot be empty');

  let minDistance = Math.abs(x - closestDot.x);
  for (let i = 1; i < dots.length; i++) {
    const dot = dots[i];
    if (dot === undefined) throw new Error('Dot cannot be undefined');
    const distance = Math.abs(x - dot.x);
    if (distance < minDistance) {
      minDistance = distance;
      closestDot = dot;
    }
  }
  return closestDot;
};
