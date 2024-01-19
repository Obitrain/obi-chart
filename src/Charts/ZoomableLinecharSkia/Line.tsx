import { Path, Skia, type SkPath } from '@shopify/react-native-skia';
import React, { type FC } from 'react';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { scaleCommands } from '../graphUtils';

export type Props = {
  path: Animated.SharedValue<SkPath>;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;
  offsetX: Animated.SharedValue<number>;
  color?: string;
};

const Line: FC<Props> = function (props) {
  const { path, scale, focalX, offsetX, color = 'red' } = props;

  const animatedPath = useDerivedValue(() => {
    const _cmds = scaleCommands(path.value.toCmds(), scale, focalX, offsetX);
    const _path = Skia.Path.MakeFromCmds(_cmds);
    if (!_path) throw new Error('Path is null');
    return _path;
  }, [scale]);

  return (
    <Path
      style="stroke"
      path={animatedPath}
      strokeWidth={2}
      strokeJoin="round"
      strokeCap="round"
      color={color}
    />
  );
};

export { Line };
