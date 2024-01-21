import {
  Circle,
  Group,
  Paint,
  usePathInterpolation,
} from '@shopify/react-native-skia';
import {
  Cursor,
  LineChart,
  useCursorGesture,
  useDotsTransition,
  type AnimatedDot,
} from 'obi-chart';
import React, { useState, type FC } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  type GestureType,
} from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button, Colors, ReText } from '../../components';
import { useDimensions } from '../../hooks';
import { useData, useShareNumberToStr } from './utils';

export type Props = {};

const GRAPH_HEIGHT = 140;
const PADDING_HORIZONTAL = 20;

const LineChartScreen: FC<Props> = function ({}) {
  const { width } = useDimensions();
  const _width = width - PADDING_HORIZONTAL * 2;
  const _height = GRAPH_HEIGHT;

  const { data: graphs, dots } = useData(_width, _height);

  const [cursorY, cursorYStr] = useShareNumberToStr(0);

  const currentGraph = useSharedValue(0);
  const progress = useSharedValue(0);
  const [isContinuous, setContinous] = useState(true);

  const path = usePathInterpolation(
    progress,
    [0, 1, 2],
    [graphs[0]!.skiaPath, graphs[1]!.skiaPath, graphs[2]!.skiaPath]
  );

  const commands = useDerivedValue(() => {
    return path.value.toCmds();
  });

  useDotsTransition({
    currentGraph,
    dataPoints: graphs.map((x) => x.dataPoints),
    path,
    dots,
  });

  const dataPoints = useDerivedValue(() => {
    return graphs[currentGraph.value]!.dataPoints;
  }, []);

  const _onChangeGraph = function () {
    const newGraph = (currentGraph.value + 1) % 3;
    currentGraph.value = newGraph;
    progress.value = withTiming(newGraph, { duration: 1000 });
  };

  const { panGesture, tapGesture, xPosition } = useCursorGesture({
    width: _width,
    height: _height,
    isContinuous,
    points: dataPoints,
  });

  //@ts-expect-error
  const gesture: GestureType = isContinuous ? panGesture : tapGesture;

  return (
    <View style={styles.container}>
      <View style={styles.btnsContainer}>
        <Button label="Change Graph" onPress={_onChangeGraph} />
        <Button
          label={isContinuous ? 'Continous' : 'Discrete'}
          onPress={() => setContinous((old) => !old)}
        />
      </View>
      <View style={styles.textContainer}>
        <ReText style={styles.value} text={cursorYStr} />
      </View>
      <GestureDetector gesture={gesture}>
        <LineChart
          style={styles.chartContainer}
          height={GRAPH_HEIGHT * 2}
          offsetY={GRAPH_HEIGHT / 2}
          offsetX={PADDING_HORIZONTAL}
          width={width}
          path={path}
          color={Colors.primary}
        >
          {renderDots(dots)}
          <Cursor
            commands={commands}
            positionX={xPosition}
            currentValue={cursorY}
            color="blue"
          />
        </LineChart>
      </GestureDetector>
    </View>
  );
};

export const renderDots = function (dots: AnimatedDot[]) {
  return (
    <Group style="stroke" strokeWidth={4} color={Colors.primary}>
      {dots.map((dot, i) => (
        <Circle key={i} cx={dot.x} cy={dot.y} r={5} opacity={dot.opacity}>
          <Paint color="white" />
        </Circle>
      ))}
    </Group>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
  },
  btnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    // marginHorizontal: 20,
  },
  textContainer: {
    marginLeft: 20,
    marginBottom: 20,
  },
  value: {
    color: Colors.secondary,
    fontSize: 18,
  },
});

export { LineChartScreen };
