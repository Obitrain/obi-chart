import { getPositionWl } from '@obitrain/charts';
import { Circle, Paint } from '@shopify/react-native-skia';
import { type FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

export type Props = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  focalX: SharedValue<number>;
  offsetX: SharedValue<number>;
};

const Dot: FC<Props> = function (props) {
  const { y, opacity, scale, focalX, offsetX } = props;

  const x = useDerivedValue(() => {
    return getPositionWl(
      props.x.value,
      focalX.value,
      scale.value,
      offsetX.value
    );
  }, []);

  return (
    <Circle cx={x} cy={y} r={5} opacity={opacity}>
      <Paint color="white" />
    </Circle>
  );
};

export { Dot };
