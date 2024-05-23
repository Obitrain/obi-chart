import {
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

const textToString = function (value: number) {
  'worklet';
  return value.toFixed(0).toString();
};

export const useSharedNumberToStr = function (
  initValue: number = 0
): [SharedValue<number>, SharedValue<string>] {
  const value = useSharedValue<number>(initValue);
  const valueStr = useDerivedValue(() => {
    return textToString(value.value);
  }, [value]);

  return [value, valueStr];
};
