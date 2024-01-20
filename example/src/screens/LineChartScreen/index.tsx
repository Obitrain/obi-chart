import {
  Circle,
  Group,
  Paint,
  usePathInterpolation,
} from '@shopify/react-native-skia';
import * as shape from 'd3-shape';
import { LineChart, buildGraph } from 'obi-chart';
import React, { useMemo, useState, type FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  makeMutable,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { getYForX } from '../../../../src/Charts/maths';
import { Button, Colors, ReText } from '../../components';
import { MONTHLY_DATA, MONTHLY_DATA_2 } from '../../data';
import { useDimensions } from '../../hooks';
import { useShareNumberToStr } from './utils';

export type Props = {};

const GRAPH_HEIGHT = 140;
const DATASET_1 = MONTHLY_DATA.map((x, i) => [i, x.value] as [number, number]);
const DATASET_2 = MONTHLY_DATA_2.map(
  (x, i) => [i, x.value] as [number, number]
);

export const useData = function (width: number, height: number) {
  // shape.curveBasis,
  const data = useMemo(
    () => [
      // DATASET_1
      ...[shape.curveBumpX, shape.curveNatural].map((_curve) =>
        buildGraph(DATASET_1, width, height, {
          curve: _curve,
        })
      ),
      // DATASET_2
      ...[shape.curveNatural].map((_curve) =>
        buildGraph(DATASET_2, width, height, {
          curve: _curve,
        })
      ),
    ],
    [height, width]
  );
  const firstGraph = data[0];
  if (!firstGraph) throw new Error('No graph found');

  const maxNbPoints = Math.max(...data.map((x) => x.dots.length));
  const points = useMemo(() => {
    return Array.from({ length: maxNbPoints }).map((_x, i) => ({
      x: makeMutable(firstGraph.dots[i]?.x ?? 0),
      y: makeMutable(firstGraph.dots[i]?.y ?? 0),
      opacity: makeMutable(firstGraph.dots[i] !== undefined ? 1 : 0),
    }));
  }, [firstGraph, maxNbPoints]);

  return { data, points };
};

const LineChartScreen: FC<Props> = function ({}) {
  const { width } = useDimensions();
  const _width = width - 40;

  const { data: graphs, points } = useData(_width, GRAPH_HEIGHT);

  const [value1, value1Str] = useShareNumberToStr(0);

  const currentGraph = useSharedValue(0);
  const progress = useSharedValue(0);
  const [isContinuous, setContinous] = useState(true);

  const path = usePathInterpolation(
    progress,
    [0, 1, 2],
    [graphs[0]!.skiaPath, graphs[1]!.skiaPath, graphs[2]!.skiaPath]
  );

  useAnimatedReaction(
    () => ({
      _currentGraph: currentGraph.value,
      _currentCommands: path.value.toCmds(),
    }),
    ({ _currentGraph, _currentCommands }) => {
      const newDots = [...graphs.map((x) => x.dots)][_currentGraph]!;

      points.map((_dot, i) => {
        const _newDot = newDots[i];
        if (!_newDot) {
          _dot.opacity.value = withTiming(0, { duration: 200 });
          return;
        } else {
          _dot.x.value = withTiming(_newDot.x, { duration: 1000 });
          const newY = getYForX(_currentCommands, _dot.x.value);
          if (newY !== undefined) {
            _dot.y.value = newY;
          }
          //   _dot.y.value = withTiming(newDots[i]!.y, { duration: 1000 });
          _dot.opacity.value = withTiming(1, { duration: 200 });
        }
      });
    }
  );

  const _onChangeGraph = function () {
    const newGraph = (currentGraph.value + 1) % 3;
    currentGraph.value = newGraph;
    progress.value = withTiming(newGraph, { duration: 1000 });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.btnsContainer}>
        <Button label="Change Graph" onPress={_onChangeGraph} />
        <Button
          label={isContinuous ? 'Continous' : 'Discrete'}
          onPress={() => setContinous((old) => !old)}
        />
      </View>
      <View style={styles.textContainer}>
        <ReText style={styles.value} text={value1Str} />
      </View>
      <LineChart
        containerStyle={styles.chartContainer}
        height={GRAPH_HEIGHT}
        width={_width}
        path={path}
        color={Colors.primary}
        currentValue={value1}
        points={graphs[0]?.dots ?? []}
        continuous={isContinuous}
      >
        {renderDots(points)}
      </LineChart>
    </ScrollView>
  );
};

export const renderDots = function (
  dots: {
    x: Animated.SharedValue<number>;
    y: Animated.SharedValue<number>;
    opacity: Animated.SharedValue<number>;
  }[]
) {
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
    marginHorizontal: 20,
  },
  textContainer: {
    marginLeft: 20,
    marginBottom: 20,
  },
  spacing: {
    marginTop: 20,
  },
  value: {
    color: Colors.secondary,
    fontSize: 18,
  },
});

export { LineChartScreen };
