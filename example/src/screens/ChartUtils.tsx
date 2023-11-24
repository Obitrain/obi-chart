import { Canvas, Line, Path, Text, vec } from '@shopify/react-native-skia';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

// const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });
// const fontStyle = {
//   fontFamily,
//   fontSize: 14,
//   fontStyle: 'italic',
//   fontWeight: 'bold',
// };
// const font = matchFont(fontStyle);

function ChartUtilsScreen() {
  return (
    <View style={styles.container}>
      <Canvas style={{ flex: 1 }}>
        <Path color="lightblue" path="M0.5,6V0.5H880.5V6"></Path>
        {/* <Group transform={[{ translateX: 0.5 }]}> */}
        <Line color="yellow" p1={vec(0, 0)} p2={vec(0, 6)}></Line>
        <Text text="0.0" color="red" y={100} x={50} />
        {/* </Group> */}
        {/* <Group transform={[{ translateX: 176.5 }]}>
          <Line color="yellow" p1={vec(0, 0)} p2={vec(0, 6)}></Line>
          <Text text="0.2" color="red" y={50} x={50} />
        </Group>
        <Group transform={[{ translateX: 352.5 }]}>
          <Line color="yellow" p1={vec(0, 0)} p2={vec(0, 6)}></Line>
          <Text text="0.4" color="red" y={9} x={0} />
        </Group>
        <Group transform={[{ translateX: 528.5 }]}>
          <Line color="yellow" p1={vec(0, 0)} p2={vec(0, 6)}></Line>
          <Text text="0.6" color="red" y={9} x={0} />
        </Group>
        <Group transform={[{ translateX: 704.5 }]}>
          <Line color="yellow" p1={vec(0, 0)} p2={vec(0, 6)}></Line>
          <Text text="0.8" color="red" y={9} x={0} />
        </Group>
        <Group transform={[{ translateX: 880.5 }]}>
          <Line color="yellow" p1={vec(0, 0)} p2={vec(0, 6)}></Line>
          <Text text="1.0" color="red" y={9} x={0} />
        </Group> */}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
});

export { ChartUtilsScreen };
