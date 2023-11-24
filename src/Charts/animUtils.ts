import { SectionList } from 'react-native';
import Animated from 'react-native-reanimated';

export const sumAll = function (d: Animated.SharedValue<number>[]): number {
  'worklet';
  return d.map((x) => x.value).reduce((sum, x) => sum + x, 0);
};

export const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList
) as any as typeof SectionList;

export const normalizeValue = function (
  value: number,
  minValue: number,
  maxValue: number,
  defaultValue: number = 1
) {
  if (maxValue - minValue === 0) return defaultValue;
  return (value - minValue) / (maxValue - minValue);
};

export const clamp = (
  value: number,
  lowerBound: number,
  upperBound: number
) => {
  'worklet';
  return Math.min(Math.max(lowerBound, value), upperBound);
};

export const round = (value: number, exponent: number) => {
  'worklet';
  const exp = 10 ** exponent;
  return Math.round(value * exp) / exp;
};
