import { Circle, type PathCommand } from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { getYForX } from './maths';

const CURSOR_SIZE = 10;

export type CursorProps = {
  commands: SharedValue<PathCommand[]>;
  positionX: SharedValue<number>;
  size?: number;
  color?: string;
  currentValue?: SharedValue<number>;
  translateY?: SharedValue<number>;
};

const Cursor: FC<CursorProps> = function ({
  commands,
  positionX,
  color,
  currentValue,
  translateY,
  size = CURSOR_SIZE,
}) {
  if (currentValue !== undefined && translateY !== undefined) {
    console.warn('Current value as no effect when translateY is set');
  }

  const _translateY = translateY
    ? translateY
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useDerivedValue(() => {
        const _commands = commands?.value;
        if (_commands === undefined) {
          return 0;
        }
        const _value = getYForX(_commands, positionX.value) ?? 0;
        if (currentValue !== undefined) {
          currentValue.value = _value;
        }
        return _value;
      });

  const transform = useDerivedValue(() => [
    { translateX: positionX.value },
    { translateY: _translateY.value },
  ]);
  return <Circle transform={transform} cx={0} cy={0} r={size} color={color} />;
};

export { Cursor };
