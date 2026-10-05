import { Path, type SkPath } from '@shopify/react-native-skia';
import { type FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

export type ScalablePathProps = {
  path: SharedValue<SkPath>;
  scale: SharedValue<number>;
  focalX: SharedValue<number>;
  offsetX: SharedValue<number>;
  color?: string;
  pathProps?: Omit<React.ComponentProps<typeof Path>, 'color' | 'path'>;
};

const ScalablePath: FC<ScalablePathProps> = function (props) {
  const { path, scale, focalX, offsetX, pathProps, color = 'red' } = props;

  const animatedPath = useDerivedValue(() => {
    // Affine equivalent of getPositionWl: x' = scale * x + focalX * (1 - scale) + offsetX
    // Plain 3x3 matrix: a Skia.Matrix() would allocate a native object per frame
    const s = scale.value;
    const tx = focalX.value * (1 - s) + offsetX.value;
    const _path = path.value.copy();
    _path.transform([s, 0, tx, 0, 1, 0, 0, 0, 1]);
    return _path;
  });

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
