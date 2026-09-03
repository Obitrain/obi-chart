import { Group, Line, vec, type Color } from '@shopify/react-native-skia';
import type { FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

export type CursorLineProps = {
  positionX: SharedValue<number>;
  height: number;
  offsetY?: number;
  color?: Color;
  strokeWidth?: number;
};

/** Vertical line following the cursor across the whole chart height. */
const CursorLine: FC<CursorLineProps> = function (props) {
  const {
    positionX,
    height,
    offsetY = 0,
    color = 'white',
    strokeWidth = 1,
  } = props;
  const transform = useDerivedValue(() => [{ translateX: positionX.value }]);
  return (
    <Group transform={transform}>
      <Line
        p1={vec(0, offsetY)}
        p2={vec(0, offsetY + height)}
        color={color}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
};

export { CursorLine };
