import { Canvas, Circle } from '@shopify/react-native-skia';
import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import {
  makeMutable,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '../../components';

const DOTS_1 = [
  { x: 10, y: 10 },
  { x: 50, y: 150 },
  { x: 200, y: 260 },
  { x: 290, y: 100 },
];

const DOTS_2 = [
  { x: 20, y: 10 },
  { x: 50, y: 100 },
  { x: 180, y: 200 },
  { x: 290, y: 150 },
];

const DOTS_3 = [
  { x: 20, y: 10 },
  { x: 50, y: 100 },
  { x: 100, y: 200 },
  { x: 150, y: 150 },
  { x: 290, y: 150 },
];

const DOTS = Array.from({
  length: Math.max(DOTS_1.length, DOTS_2.length, DOTS_3.length),
}).map((_dot) => ({
  x: makeMutable(0),
  y: makeMutable(0),
  opacity: makeMutable(0),
}));

function DotsScreen() {
  const currentDots = useSharedValue(0);

  const _onChange = React.useCallback(() => {
    currentDots.value = (currentDots.value + 1) % 3;
  }, [currentDots]);

  useAnimatedReaction(
    () => (currentDots.value + 1) % 3,
    (_currentDots) => {
      const newDots = [DOTS_1, DOTS_2, DOTS_3][_currentDots]!;

      DOTS.map((_dot, i) => {
        const _newDot = newDots[i];
        if (!_newDot) {
          _dot.opacity.value = withTiming(0, { duration: 200 });
          return;
        } else {
          _dot.x.value = withTiming(newDots[i]!.x, { duration: 500 });
          _dot.y.value = withTiming(newDots[i]!.y, { duration: 500 });
          _dot.opacity.value = withTiming(1, { duration: 200 });
        }
      });
    }
  );

  return (
    <View style={styles.container}>
      <View>
        <Button label="Change" onPress={_onChange} />
      </View>
      <Canvas style={styles.canvas}>
        {DOTS.map((dot, i) => (
          <Circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={10}
            color="red"
            opacity={dot.opacity}
          />
        ))}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: { width: 300, height: 300, backgroundColor: 'white' },
});

export { DotsScreen };
