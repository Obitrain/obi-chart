import {
  PathVerb,
  Skia,
  type PathCommand,
  type SkPath,
} from '@shopify/react-native-skia';
import { scaleLinear, type ScaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';
import Animated, {
  useAnimatedReaction,
  withTiming,
} from 'react-native-reanimated';
import { getPositionWl } from './gesture';
import { getYForX } from './maths';
import type { AnimatedDot, DataPoint } from './types';

export type Config = {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  // See https://d3js.org/d3-shape/curve
  curve?: shape.CurveFactory | shape.CurveFactoryLineOnly;
};

export type GraphData = {
  data: [number, number][];
  minY: number;
  maxY: number;
  path: string;
  skiaPath: SkPath;
  dataPoints: DataPoint[];
  scaleX: ScaleLinear<number, number, never>;
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

  const dataPoints = fmtValues.map(([y, x]) => ({
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
    dataPoints,
    skiaPath,
    scaleX,
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
  scaleX: Animated.SharedValue<number>,
  focalX: Animated.SharedValue<number>,
  offsetX: Animated.SharedValue<number>,
  scaleY?: Animated.SharedValue<number>
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
    if (commandType === PathVerb.Move) return command;
    throw new Error(`Unsupported command type ${commandType}`);
  });
};

export type UseDotAnimationProps = {
  currentGraph: Animated.SharedValue<number>;
  path: Animated.SharedValue<SkPath>;
  dataPoints: DataPoint[][];
  dots: AnimatedDot[];
  opacityWl?: (opacity: number) => number;
  translateWl?: (position: number) => number;
};

const defaultOpacityTransitionWl = function (opacity: number) {
  'worklet';
  return withTiming(opacity, { duration: 200 });
};
const defaultTranslateTransitionWl = function (position: number) {
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

  useAnimatedReaction(
    () => ({
      _currentGraph: currentGraph.value,
      _currentCommands: path.value.toCmds(),
    }),
    ({ _currentGraph, _currentCommands }) => {
      const newDataPoints = dataPoints[_currentGraph];
      if (newDataPoints === undefined)
        throw new Error('Data points cannot be undefined');
      dots.map((_dot, i) => {
        const _newDot = newDataPoints[i];
        if (!_newDot) {
          _dot.opacity.value = opacityWl(0);
          return;
        } else {
          _dot.x.value = translateWl(_newDot.x);
          const newY = getYForX(_currentCommands, _dot.x.value);
          if (newY !== undefined) {
            _dot.y.value = newY;
          }
          //   _dot.y.value = withTiming(newDots[i]!.y, { duration: 1000 });
          _dot.opacity.value = opacityWl(1);
        }
      });
    }
  );
};
