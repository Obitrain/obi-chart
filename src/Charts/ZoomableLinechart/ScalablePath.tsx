import {
  Path,
  Skia,
  type PathCommand,
  type SkPath,
} from '@shopify/react-native-skia';
import { type FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { scaleCommands } from '../graphUtils';

export type ScalablePathProps = {
  path: SharedValue<SkPath>;
  scale: SharedValue<number>;
  focalX: SharedValue<number>;
  offsetX: SharedValue<number>;
  color?: string;
  pathProps?: Omit<React.ComponentProps<typeof Path>, 'color'>;
};

const ScalablePath: FC<ScalablePathProps> = function (props) {
  const { path, scale, focalX, offsetX, pathProps, color = 'red' } = props;

  const animatedPath = useDerivedValue(() => {
    let _cmds: PathCommand[] = [];
    try {
      _cmds = scaleCommands(path.value?.toCmds() ?? [], scale, focalX, offsetX);
    } catch (e) {
      console.error('Got error while scaling path: ', typeof e);
      _cmds = [];
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
