import { Circle, type PathCommand } from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { getYForX } from './maths';

const CURSOR_SIZE = 10;

export type CursorProps = {
  commands: Animated.SharedValue<PathCommand[]>;
  positionX: Animated.SharedValue<number>;
  size?: number;
  color?: string;
  currentValue?: Animated.SharedValue<number>;
};

const Cursor: FC<CursorProps> = function ({
  commands,
  positionX,
  color,
  currentValue,
  size = CURSOR_SIZE,
}) {
  const translationY = useDerivedValue(() => {
    const _value = getYForX(commands.value, positionX.value) ?? 0;
    if (currentValue !== undefined) {
      currentValue.value = _value;
    }
    return _value;
  });

  const transform = useDerivedValue(() => [
    { translateX: positionX.value },
    { translateY: translationY.value },
  ]);
  return <Circle transform={transform} cx={0} cy={0} r={size} color={color} />;
};

export { Cursor };
