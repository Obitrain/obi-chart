import Animated, {
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

const textToString = function (value: number) {
  'worklet';
  return value.toFixed(0).toString();
};

export const useShareNumberToStr = function (
  initValue: number = 0
): [Animated.SharedValue<number>, Animated.SharedValue<string>] {
  const value = useSharedValue<number>(initValue);
  const valueStr = useDerivedValue(() => {
    return textToString(value.value);
  }, [value]);

  return [value, valueStr];
};
