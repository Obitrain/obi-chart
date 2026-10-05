import {
  PathVerb,
  Skia,
  type PathCommand,
  type SkPath,
} from '@shopify/react-native-skia';
import { useMemo, useRef } from 'react';
import { scaleLinear, type ScaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { getPositionWl } from './gesture';
import { commandsToBezier, findBezierIndex, getYOnBezier } from './maths';
import type { AnimatedDot, DataPoint } from './types';

export type BuildGraphConfig = {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  // See https://d3js.org/d3-shape/curve
  curve?: shape.CurveFactory | shape.CurveFactoryLineOnly;
};

/** @deprecated Use {@link BuildGraphConfig} instead */
export type Config = BuildGraphConfig;

export type GraphData = {
  data: [x: number, y: number][];
  minY: number;
  maxY: number;
  path: string;
  skiaPath: SkPath;
  dataPoints: DataPoint[];
  scaleX: ScaleLinear<number, number, never>;
  scaleY: ScaleLinear<number, number, never>;
};

export const buildGraph = function (
  data: [x: number, y: number][],
  width: number,
  height: number,
  config?: BuildGraphConfig
): GraphData {
  if (data.length === 0)
    throw new Error('buildGraph requires at least one data point');

  const minX = config?.minX ?? Math.min(...data.map((d) => d[0]));
  const maxX = config?.maxX ?? Math.max(...data.map((d) => d[0]));
  const scaleX = scaleLinear().domain([minX, maxX]).range([0, width]);

  const minY = config?.minY ?? Math.min(...data.map((d) => d[1]));
  const maxY = config?.maxY ?? Math.max(...data.map((d) => d[1]));
  const scaleY = scaleLinear().domain([minY, maxY]).range([height, 0]);

  const path = shape
    .line<[number, number]>()
    .x(([x]) => scaleX(x))
    .y(([, y]) => scaleY(y))
    .curve(config?.curve ?? shape.curveBasis)(data);
  if (path === null) throw new Error('Failed to build the line path');

  const dataPoints = data.map(([x, y]) => ({
    x: scaleX(x),
    y: scaleY(y),
    value: y,
  }));

  const skiaPath = Skia.Path.MakeFromSVGString(path);
  if (skiaPath == null) throw new Error('Failed to parse the SVG path');

  return {
    data,
    minY,
    maxY,
    path,
    dataPoints,
    skiaPath,
    scaleX,
    scaleY,
  };
};

/**
 * For now, only support commands of type:
 * - PathVerb.Move
 * - PathVerb.Cubic
 * - PathVerb.Quad
 * - PathVerb.Line
 */
export const scaleCommands = function (
  commands: PathCommand[],
  scaleX: SharedValue<number>,
  focalX: SharedValue<number>,
  offsetX: SharedValue<number>,
  scaleY?: SharedValue<number>
): PathCommand[] {
  'worklet';
  const _scaleY = scaleY ? scaleY.value : 1;
  return commands.map((command) => {
    const commandType = command[0];
    if (commandType === undefined)
      throw new Error('Got undefined command type');

    if (commandType === PathVerb.Line) {
      return [
        commandType,
        getPositionWl(command[1]!, focalX.value, scaleX.value, offsetX.value),
        command[2]! * _scaleY,
      ];
    }
    if (commandType === PathVerb.Move) {
      return [
        commandType,
        getPositionWl(command[1]!, focalX.value, scaleX.value, offsetX.value),
        command[2]! * _scaleY,
      ];
    }
    if (commandType === PathVerb.Quad)
      return [
        commandType,
        getPositionWl(command[1]!, focalX.value, scaleX.value, offsetX.value),
        command[2]! * _scaleY,
        getPositionWl(command[3]!, focalX.value, scaleX.value, offsetX.value),
        command[4]! * _scaleY,
      ];
    if (commandType === PathVerb.Cubic) {
      return [
        commandType,
        // c1
        getPositionWl(command[1]!, focalX.value, scaleX.value, offsetX.value),
        command[2]! * _scaleY,
        // c2
        getPositionWl(command[3]!, focalX.value, scaleX.value, offsetX.value),
        command[4]! * _scaleY,
        // to
        getPositionWl(command[5]!, focalX.value, scaleX.value, offsetX.value),
        command[6]! * _scaleY,
      ];
    }
    if (commandType === PathVerb.Close) return command;
    throw new Error(`Unsupported command type ${commandType}`);
  });
};

export type UseDotAnimationProps = {
  currentGraph: SharedValue<number>;
  path: SharedValue<SkPath>;
  dataPoints: DataPoint[][];
  dots: AnimatedDot[];
  opacityWl?: (opacity: number) => number;
  translateWl?: (position: number) => number;
};

export const defaultOpacityTransitionWl = function (opacity: number) {
  'worklet';
  return withTiming(opacity, { duration: 200 });
};
export const defaultTranslateTransitionWl = function (position: number) {
  'worklet';
  return withTiming(position, { duration: 1000 });
};

export const useDotsTransition = function (props: UseDotAnimationProps) {
  const {
    currentGraph,
    path,
    dataPoints,
    dots,
    opacityWl = defaultOpacityTransitionWl,
    translateWl = defaultTranslateTransitionWl,
  } = props;

  // Normalized once per path change, not per dot per frame
  const commands = useSharedValue<PathCommand[]>([]);
  const visibleCount = useSharedValue(0);
  // Bumped when the data or the dots are replaced, so they get retargeted
  // even if the graph index is unchanged
  const generationRef = useRef(0);
  const generation = useMemo(
    () => (generationRef.current += 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataPoints, dots]
  );

  // Retarget on graph or data change only: re-assigning x while it animates
  // would restart the animation every frame
  useAnimatedReaction(
    () => ({
      _currentGraph: currentGraph.value,
      _path: path.value,
      _generation: generation,
    }),
    ({ _currentGraph, _path, _generation }, previous) => {
      commands.value = commandsToBezier(_path.toCmds());
      if (
        previous !== null &&
        previous._currentGraph === _currentGraph &&
        previous._generation === _generation
      )
        return;

      const newDataPoints = dataPoints[_currentGraph];
      if (newDataPoints === undefined)
        throw new Error('Data points cannot be undefined');
      visibleCount.value = newDataPoints.length;
      dots.forEach((_dot, i) => {
        const _newDot = newDataPoints[i];
        if (!_newDot) {
          _dot.opacity.value = opacityWl(0);
          return;
        }
        _dot.x.value = translateWl(_newDot.x);
        _dot.opacity.value = opacityWl(1);
      });
    },
    // Explicit deps: without them the reaction re-registers and re-fires on
    // every parent render, restarting every dot animation on the UI thread
    [currentGraph, path, dataPoints, dots, opacityWl, translateWl, generation]
  );

  // Keep y glued to the curve while x animates or the path tweens
  useAnimatedReaction(
    () => ({ _cmds: commands.value, _xs: dots.map((d) => d.x.value) }),
    ({ _cmds, _xs }) => {
      const count = Math.min(visibleCount.value, dots.length);
      // Dots are in x order, so one forward walk over the segments serves them all
      let segment = 0;
      for (let i = 0; i < count; i++) {
        const x = _xs[i]!;
        let index = findBezierIndex(_cmds, x, segment);
        if (index === -1 && segment > 1) index = findBezierIndex(_cmds, x);
        if (index === -1) continue;
        segment = index;
        const newY = getYOnBezier(_cmds, index, x);
        if (newY !== undefined) dots[i]!.y.value = newY;
      }
    },
    [dots]
  );
};
