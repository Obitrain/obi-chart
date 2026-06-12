import { Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { type FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

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
    // Affine equivalent of getPositionWl: x' = scale * x + focalX * (1 - scale) + offsetX
    const _path = path.value.copy();
    _path.transform(
      Skia.Matrix()
        .translate(focalX.value * (1 - scale.value) + offsetX.value, 0)
        .scale(scale.value, 1)
    );
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
