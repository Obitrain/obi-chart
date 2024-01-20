import {
  PathVerb,
  Skia,
  type PathCommand,
  type SkPath,
} from '@shopify/react-native-skia';
import { scaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';
import Animated, {
  useAnimatedReaction,
  withTiming,
} from 'react-native-reanimated';
import { getPositionWl } from './gesture';
import { getYForX } from './maths';

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

/**
 * For now, only support commands of type:
 * - PathVerb.Move
 * - PathVerb.Cubic
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
    if (commandType === PathVerb.Move) {
      return [
        commandType,
        getPositionWl(command[1]!, focalX.value, scaleX.value, offsetX.value),
        command[2]! * _scaleY,
      ];
    }
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
    return command;
  });
};

export type UseDotAnimationProps = {
  currentGraph: Animated.SharedValue<number>;
  path: Animated.SharedValue<SkPath>;
  graphs: GraphData[];
  points: {
    x: Animated.SharedValue<number>;
    y: Animated.SharedValue<number>;
    opacity: Animated.SharedValue<number>;
  }[];
  opacityFn?: (opacity: number) => number;
  translateFn?: (position: number) => number;
};

const defaultOpacityTransitionFn = function (opacity: number) {
  'worklet';
  return withTiming(opacity, { duration: 200 });
};
const defaultTranslateTransitionFn = function (position: number) {
  'worklet';
  return withTiming(position, { duration: 1000 });
};

export const useDotAnimation = function (props: UseDotAnimationProps) {
  const {
    currentGraph,
    path,
    graphs,
    points,
    opacityFn = defaultOpacityTransitionFn,
    translateFn = defaultTranslateTransitionFn,
  } = props;

  useAnimatedReaction(
    () => ({
      _currentGraph: currentGraph.value,
      _currentCommands: path.value.toCmds(),
    }),
    ({ _currentGraph, _currentCommands }) => {
      const newDots = [...graphs.map((x) => x.dots)][_currentGraph]!;

      points.map((_dot, i) => {
        const _newDot = newDots[i];
        if (!_newDot) {
          _dot.opacity.value = opacityFn(0);
          return;
        } else {
          _dot.x.value = translateFn(_newDot.x);
          const newY = getYForX(_currentCommands, _dot.x.value);
          if (newY !== undefined) {
            _dot.y.value = newY;
          }
          //   _dot.y.value = withTiming(newDots[i]!.y, { duration: 1000 });
          _dot.opacity.value = defaultOpacityTransitionFn(1);
        }
      });
    }
  );
};
