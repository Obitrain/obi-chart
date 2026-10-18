import { Skia, type SkPath } from 'react-native-skia';
import { scaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';
import type { BuildGraphConfig } from './graphUtils';

export type BuildBandConfig = Omit<BuildGraphConfig, 'curve'> & {
  // Areas need a full curve factory (line-only curves have no area start/end)
  curve?: shape.CurveFactory;
};

export type BandDatum = [x: number, lower: number, upper: number];

/**
 * Closed path of the area between a lower and an upper series sharing x values,
 * e.g. an expected range drawn behind a line. Pass the line's domain in `config` so both line up.
 */
export const buildBandPath = function (
  data: BandDatum[],
  width: number,
  height: number,
  config?: BuildBandConfig
): SkPath {
  if (data.length === 0)
    throw new Error('buildBandPath requires at least one data point');

  let dataMinX = Infinity;
  let dataMaxX = -Infinity;
  let dataMinY = Infinity;
  let dataMaxY = -Infinity;
  for (const [x, lower, upper] of data) {
    if (x < dataMinX) dataMinX = x;
    if (x > dataMaxX) dataMaxX = x;
    if (lower < dataMinY) dataMinY = lower;
    if (upper > dataMaxY) dataMaxY = upper;
  }
  const scaleX = scaleLinear()
    .domain([config?.minX ?? dataMinX, config?.maxX ?? dataMaxX])
    .range([0, width]);
  const scaleY = scaleLinear()
    .domain([config?.minY ?? dataMinY, config?.maxY ?? dataMaxY])
    .range([height, 0]);

  const path = shape
    .area<BandDatum>()
    .x(([x]) => scaleX(x))
    .y0(([, lower]) => scaleY(lower))
    .y1(([, , upper]) => scaleY(upper))
    .curve(config?.curve ?? shape.curveLinear)(data);
  if (path === null) throw new Error('Failed to build the band path');

  const skiaPath = Skia.Path.MakeFromSVGString(path);
  if (skiaPath == null) throw new Error('Failed to parse the SVG path');
  return skiaPath;
};
