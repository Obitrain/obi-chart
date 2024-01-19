import { Group } from '@shopify/react-native-skia';
import { ZoomableLineChart, useAxisGesture } from 'obi-chart';
import React, { type FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { Button, Colors } from '../../components';
import { useDimensions } from '../../hooks';
import { Dot } from './Dot';
import { useData } from './utils';

const GRAPH_HEIGHT = 140;
const PADDING_HORIZONTAL = 20;
const TEST_ZOOM = 2;
const TEST_FOCAL = 200;

export type Props = {};

const ZoomableLineChartScreen: FC<Props> = function ({}) {
  //   const [lineChartWidth, setLineChartWidth] = React.useState(0);
  const { width } = useDimensions();

  const _width = width - PADDING_HORIZONTAL * 2;
  const { data: graphs, points } = useData(_width, GRAPH_HEIGHT);

  const path = useSharedValue(graphs[0]!.skiaPath);

  const { scale, focalX, pinchGesture, panGesture, offsetX, reset } =
    useAxisGesture({ width: _width, startOffset: PADDING_HORIZONTAL });

  const resetChart = () => {
    reset();
  };

  //@ts-expect-error
  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  return (
    <View style={styles.container}>
      <View style={styles.btnsContainer}>
        <Button label="Reset Chart" small onPress={resetChart} />

        <Button
          label={`Set zoom (${TEST_ZOOM})`}
          small
          onPress={() => (scale.value = scale.value === 1 ? TEST_ZOOM : 1)}
        />
        <Button
          label={`Set focal (${TEST_FOCAL})`}
          small
          onPress={() => (focalX.value = focalX.value === 0 ? TEST_FOCAL : 0)}
        />
      </View>
      <GestureDetector gesture={gesture}>
        <View style={styles.graphContainer}>
          <ZoomableLineChart
            height={GRAPH_HEIGHT}
            width={width}
            {...{ path, offsetX, scale, focalX }}
            style={styles.canvas}
            color={Colors.primary}
          >
            {renderDots(points, scale, focalX, offsetX)}
          </ZoomableLineChart>
        </View>
      </GestureDetector>
    </View>
  );
};

export const renderDots = function (
  dots: {
    x: Animated.SharedValue<number>;
    y: Animated.SharedValue<number>;
    opacity: Animated.SharedValue<number>;
  }[],
  scale: Animated.SharedValue<number>,
  focalX: Animated.SharedValue<number>,
  offsetX: Animated.SharedValue<number>
) {
  return (
    <Group style="stroke" strokeWidth={4} color={Colors.primary}>
      {dots.map((dot, i) => (
        <Dot key={i} {...dot} {...{ scale, focalX, offsetX }} />
      ))}
    </Group>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    backgroundColor: Colors.white,
    // marginHorizontal: 20,
    // marginTop: 100,
  },
  btnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 20,
    flexWrap: 'wrap',
  },
  graphContainer: {
    // marginHorizontal: 20,
    marginTop: 100,
  },
});

export { ZoomableLineChartScreen };
