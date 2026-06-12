import { Circle, type PathCommand } from '@shopify/react-native-skia';
import type { FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { getYForX } from './maths';

const CURSOR_SIZE = 10;

export type CursorProps = {
  commands?: SharedValue<PathCommand[]>;
  positionX: SharedValue<number>;
  size?: number;
  color?: string;
  currentValue?: SharedValue<number> | SharedValue<number | undefined>;
  translateY?: SharedValue<number | undefined>;
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
    console.warn('currentValue has no effect when translateY is set');
  }

  const derivedTranslateY = useDerivedValue(() => {
    const _commands = commands?.value;
    if (_commands === undefined) {
      return 0;
    }
    const _value = getYForX(_commands, positionX.value) ?? 0;
    if (translateY === undefined && currentValue !== undefined) {
      currentValue.value = _value;
    }
    return _value;
  });

  const _translateY = translateY ?? derivedTranslateY;

  const transform = useDerivedValue(() => [
    { translateX: positionX.value },
    { translateY: _translateY.value ?? 0 },
  ]);
  return <Circle transform={transform} cx={0} cy={0} r={size} color={color} />;
};

export { Cursor };
