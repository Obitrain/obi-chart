import {
  Cursor,
  LineChart,
  useCursorGesture,
  useDotsTransition,
  type AnimatedDot,
} from '@obitrain/charts';
import {
  Circle,
  Group,
  Paint,
  Rect,
  usePathInterpolation,
} from '@shopify/react-native-skia';
import React, { useMemo, useState, type FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  type GestureType,
} from 'react-native-gesture-handler';
import {
  makeMutable,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button, Colors } from '../../components';
import { ReTextInt } from '../../components/AnimatedText';
import { useDimensions } from '../../hooks';
import { useData } from './utils';

export type Props = {};

const GRAPH_HEIGHT = 140;
const PADDING_HORIZONTAL = 20;

const LineChartScreen: FC<Props> = function ({}) {
  const { width } = useDimensions();
  const _width = width - PADDING_HORIZONTAL * 2;
  const _height = GRAPH_HEIGHT;

  const { data: graphs, dots } = useData(_width, _height);

  const currentGraph = useSharedValue(0);
  const progress = useSharedValue(0);
  const [isContinuous, setContinous] = useState(true);
  const [showMultiple, setShowMultiple] = useState(false);
  const [showBackground, setShowBackground] = useState(false);

  const cursorY = useSharedValue(0);
  const path = usePathInterpolation(
    progress,
    [0, 1, 2],
    [graphs[0]!.skiaPath, graphs[1]!.skiaPath, graphs[2]!.skiaPath]
  );
  const paths = useMemo(() => {
    return [
      {
        id: 'graph1',
        path: graphs[0]!.skiaPath,
        commands: makeMutable(graphs[0]!.skiaPath.toCmds()),
        color: Colors.primary,
        value: makeMutable(0),
      },
      {
        id: 'graph2',
        path: graphs[1]!.skiaPath,
        commands: makeMutable(graphs[1]!.skiaPath.toCmds()),
        color: Colors.secondary,
        value: makeMutable(0),
      },
      {
        id: 'graph3',
        path: graphs[2]!.skiaPath,
        commands: makeMutable(graphs[2]!.skiaPath.toCmds()),
        color: Colors.success,
        value: makeMutable(0),
      },
    ];
  }, [graphs]);

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
    setShowMultiple(false);
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

  const gesture: GestureType = isContinuous ? panGesture : tapGesture;

  return (
    <View style={styles.container}>
      <View style={styles.btnsContainer}>
        <Button label="Change Graph" onPress={_onChangeGraph} />
        <Button
          label="Show Multiple"
          onPress={() => setShowMultiple((old) => !old)}
        />
        <Button
          label={isContinuous ? 'Continous' : 'Discrete'}
          onPress={() => setContinous((old) => !old)}
        />
        <Button
          label={showBackground ? 'Hide Background' : 'Show Background'}
          onPress={() => setShowBackground((old) => !old)}
        />
      </View>
      <View style={styles.textContainer}>
        {showMultiple ? (
          paths.map((_path, i) => (
            <View key={_path.id}>
              <Text>{_path.id}</Text>
              <ReTextInt key={i} style={styles.value} text={_path.value} />
            </View>
          ))
        ) : (
          <ReTextInt style={styles.value} text={cursorY} />
        )}
      </View>
      <GestureDetector gesture={gesture}>
        <LineChart
          style={styles.chartContainer}
          height={GRAPH_HEIGHT * 2}
          offsetY={GRAPH_HEIGHT / 2}
          offsetX={PADDING_HORIZONTAL}
          width={width}
          path={path}
          paths={showMultiple ? paths : undefined}
          color={Colors.primary}
          background={
            showBackground ? (
              <Rect
                width={width}
                height={GRAPH_HEIGHT * 2}
                color={Colors.secondary}
              />
            ) : null
          }
        >
          {renderDots(dots)}
          {showMultiple ? (
            paths.map((_path) => (
              <Cursor
                key={_path.id}
                commands={_path.commands}
                positionX={xPosition}
                currentValue={_path.value}
                color={_path.color}
              />
            ))
          ) : (
            <Cursor
              commands={commands}
              positionX={xPosition}
              currentValue={cursorY}
              color="blue"
            />
          )}
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
    flexWrap: 'wrap',
    marginVertical: 20,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    // marginHorizontal: 20,
  },
  textContainer: {
    marginLeft: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 20,
  },
  value: {
    color: Colors.secondary,
    fontSize: 18,
  },
});

export { LineChartScreen };
