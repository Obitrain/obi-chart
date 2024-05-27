import {
  Circle,
  type PathCommand,
  type SkPath,
} from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import {
  isSharedValue,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { getYForX } from './maths';

const CURSOR_SIZE = 10;

export type CursorProps = {
  commands?: SharedValue<PathCommand[]>;
  path?: SharedValue<SkPath> | SkPath;
  positionX: SharedValue<number>;
  size?: number;
  color?: string;
  currentValue?: SharedValue<number>;
};

const Cursor: FC<CursorProps> = function ({
  commands,
  path,
  positionX,
  color,
  currentValue,
  size = CURSOR_SIZE,
}) {
  if (commands === undefined && path === undefined) {
    console.warn('Specify either a path or commands.');
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const translationY = useDerivedValue(() => {
    const _commands =
      commands?.value ??
      (isSharedValue<SkPath>(path) ? path?.value?.toCmds() : path?.toCmds());
    if (_commands === undefined) {
      return 0;
    }
    const _value = getYForX(_commands, positionX.value) ?? 0;
    if (currentValue !== undefined) {
      currentValue.value = _value;
    }
    return _value;
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const transform = useDerivedValue(() => [
    { translateX: positionX.value },
    { translateY: translationY.value },
  ]);
  return <Circle transform={transform} cx={0} cy={0} r={size} color={color} />;
};

export { Cursor };
