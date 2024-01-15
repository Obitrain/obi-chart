import type { PathCommand } from '@shopify/react-native-skia';
import type { FC } from 'react';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { clamp } from '../animUtils';
import { getYForX } from './maths';

const CURSOR_SIZE = 15;

const styles = StyleSheet.create({
  cursor: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export type Props = {
  cmds: Animated.SharedValue<PathCommand[]>;
  positionX: Animated.SharedValue<number>;
  maxWidth: number;
  size?: number;
  color?: string;
  currentValue?: Animated.SharedValue<number>;
};

const Cursor: FC<Props> = function ({
  cmds,
  positionX,
  maxWidth,
  color,
  currentValue,
  size = CURSOR_SIZE,
}) {
  const translationX = useDerivedValue(() => {
    return clamp(positionX.value, 0, maxWidth);
  });
  const translationY = useDerivedValue(() => {
    const _value = getYForX(cmds.value, translationX.value) ?? 0;
    if (currentValue !== undefined) {
      currentValue.value = _value;
    }
    return _value;
  });

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = translationX.value - size / 2;
    const translateY = translationY.value - size / 2;
    return {
      transform: [{ translateX }, { translateY }],
    };
  }, [size]);

  return (
    <Animated.View
      style={[
        styles.cursor,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

export { Cursor };

// import { Circle, Group } from '@shopify/react-native-skia';
// import type { FC } from 'react';
// import React from 'react';
// import Animated, { useDerivedValue } from 'react-native-reanimated';
// import { Colors } from '../../../theme';

// const CURSOR_SIZE = 15;

// export type Props = {
//   x: Animated.SharedValue<number>;
//   y: Animated.SharedValue<number>;
//   width: number;
//   color?: string;
//   size?: number;
// };

// const Cursor: FC<Props> = function ({
//   x,
//   y,
//   color = Colors.primary,
//   size = CURSOR_SIZE,
// }) {
//   const transform = useDerivedValue(() => [
//     { translateX: x.value },
//     { translateY: y.value },
//   ]);

//   return (
//     <Group transform={transform}>
//       <Circle cx={0} cy={0} r={size} color={color} opacity={0.15} />
//     </Group>
//   );
// };

// export { Cursor };
