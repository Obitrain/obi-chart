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
  pathProps?: Omit<React.ComponentProps<typeof Path>, 'color'>;
};

const ScalablePath: FC<Props> = function (props) {
  const { path, scale, focalX, offsetX, pathProps, color = 'red' } = props;

  const animatedPath = useDerivedValue(() => {
    let _cmds = [];
    try {
      _cmds = scaleCommands(path.value?.toCmds() ?? [], scale, focalX, offsetX);
    } catch (e) {
      console.log(e);
      console.log(path.value == null);
      console.log(path.value);
    }
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
      {...pathProps}
    />
  );
};

export { ScalablePath };
