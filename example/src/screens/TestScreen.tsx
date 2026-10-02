import {
  Canvas,
  Path,
  Skia,
  usePathInterpolation,
} from 'react-native-skia';
import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

const angryPath = Skia.PathBuilder.Make()
  .moveTo(16, 25)
  .cubicTo(32.2, 27.09, 43.04, 28.2, 48.51, 28.34)
  .cubicTo(53.99, 28.48, 62.15, 27.78, 73, 26.25)
  .cubicTo(66.28, 53.93, 60.19, 69.81, 54.74, 73.88)
  .cubicTo(50.63, 76.96, 40.4, 74.65, 27.48, 54.51)
  .cubicTo(24.68, 50.15, 20.85, 40.32, 27.48, 54.51)
  .close()
  .build();

const normalPath = Skia.PathBuilder.Make()
  .moveTo(20.9, 30.94)
  .cubicTo(31.26, 31.66, 38.61, 32.2, 42.96, 32.56)
  .cubicTo(66.94, 34.53, 79.65, 36.45, 81.11, 38.32)
  .cubicTo(83.9, 41.9, 73.77, 56.6, 65.83, 59.52)
  .cubicTo(61.95, 60.95, 45.72, 58.91, 32.42, 49.7)
  .cubicTo(23.56, 43.56, 19.71, 37.3, 20.9, 30.94)
  .close()
  .build();

const goodPath = Skia.PathBuilder.Make()
  .moveTo(21, 45)
  .cubicTo(21, 36.78, 24.26, 29.42, 29.41, 24.47)
  .cubicTo(33.61, 20.43, 38.05, 18, 45, 18)
  .cubicTo(58.25, 18, 69, 30.09, 69, 45)
  .cubicTo(69, 59.91, 58.25, 72, 45, 72)
  .cubicTo(31.75, 72, 21, 59.91, 21, 45)
  .close()
  .build();

function TestScreen() {
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 });
  }, [progress]);

  const path = usePathInterpolation(
    progress,
    [0, 0.5, 1],
    [angryPath, normalPath, goodPath]
  );

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Path
          path={path}
          style="stroke"
          strokeWidth={5}
          strokeCap="round"
          strokeJoin="round"
          //   color="blue"
        />
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

export { TestScreen };
