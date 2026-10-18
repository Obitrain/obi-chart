import {
  AxisLabels,
  Cursor,
  LinePlot,
  YAxis,
  buildBandPath,
  buildGraph,
  getAlignedTicks,
  getBandStops,
  useCursorGesture,
  useDotsTransition,
  type AnimatedDot,
  type LinePath,
  type ValueBand,
} from '@obitrain/charts';
import {
  Canvas,
  Circle,
  Group,
  Paint,
  Path,
  Rect,
  matchFont,
  useFont,
  usePathInterpolation,
} from 'react-native-skia';
import * as shape from 'd3-shape';
import { useMemo, useState, type FC } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Chip, Colors } from '../../components';
import { ReTextInt } from '../../components/AnimatedText';
import { useDemo, useDimensions } from '../../hooks';
import { useData } from './utils';

export type Props = {};

const GRAPH_HEIGHT = 180;
const PADDING_HORIZONTAL = 20;
// Room above the plot for the top tick label
const TOP_PAD = 16;
const GRAPH_COLORS = [Colors.primary, Colors.secondary, Colors.warning];
const SECOND_AXIS_COLOR = 'rgb(125, 130, 184)';
// Half-width of the demo range band, as a share of the plot's value span
const BAND_SPREAD = 0.15;

/** Low / mid / high thirds of the plot, coloured by `getBandStops`. */
const getBands = function (minY: number, maxY: number): ValueBand[] {
  const span = maxY - minY;
  return [
    { to: minY + span * 0.4, color: Colors.primary },
    { from: minY + span * 0.4, to: minY + span * 0.7, color: Colors.secondary },
    { from: minY + span * 0.7, color: Colors.error },
  ];
};

// Ticks are already rounded to their step: print them as is
const formatTick = (value: number) => `${value}`;

const LineChartScreen: FC<Props> = function ({}) {
  const { width } = useDimensions();
  const _width = width - PADDING_HORIZONTAL * 2;
  const _height = GRAPH_HEIGHT;

  const { data: graphs, dots } = useData(_width, _height);

  const currentGraph = useSharedValue(0);
  const [graphIndex, setGraphIndex] = useState(0);
  const progress = useSharedValue(0);
  const [isContinuous, setContinous] = useState(true);
  const [showMultiple, setShowMultiple] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [showAxis, setShowAxis] = useState(true);
  const [showFill, setShowFill] = useState(false);
  const [showBands, setShowBands] = useState(false);
  const [scrollable, setScrollable] = useState(true);
  const [showSecondAxis, setShowSecondAxis] = useState(false);
  const [showRange, setShowRange] = useState(false);

  const webFont = useFont(
    require('../../../assets/fonts/SpaceMono-Regular.ttf'),
    10
  );
  const font = useMemo(
    () =>
      Platform.OS === 'web'
        ? webFont
        : matchFont({
            fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
            fontSize: 10,
          }),
    [webFont]
  );

  const cursorY = useSharedValue(0);
  const path = usePathInterpolation(
    progress,
    [0, 1, 2],
    [graphs[0]!.skiaPath, graphs[1]!.skiaPath, graphs[2]!.skiaPath]
  );
  const paths = useMemo(() => {
    return graphs.map((graph, i) => ({
      id: `graph${i + 1}`,
      path: graph.skiaPath,
      commands: makeMutable(graph.skiaPath.toCmds()),
      color: GRAPH_COLORS[i]!,
      value: makeMutable(0),
    }));
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
    setGraphIndex(newGraph);
    progress.value = withTiming(newGraph, { duration: 1000 });
  };

  const { panGesture, tapGesture, xPosition } = useCursorGesture({
    width: _width,
    height: _height,
    isContinuous,
    points: dataPoints,
    scrollable,
  });

  const gesture: GestureType = isContinuous ? panGesture : tapGesture;

  useDemo([
    { at: 1000, run: _onChangeGraph },
    { at: 2500, run: _onChangeGraph },
    { at: 4000, run: _onChangeGraph },
    { at: 5500, run: () => setShowMultiple(true) },
  ]);

  const graph = graphs[graphIndex]!;
  const stops = useMemo(
    () =>
      getBandStops(
        getBands(graph.minY, graph.maxY),
        graph.minY,
        graph.maxY,
        Colors.primary
      ),
    [graph]
  );

  // The other dataset, in other units, on a right-hand axis sharing the left one's gridlines
  const secondAxis = useMemo(() => {
    const other = graphs[graphIndex === 2 ? 0 : 2]!;
    const values = other.data.map(([, y]) => y);
    const ticks = getAlignedTicks(
      Math.min(...values),
      Math.max(...values),
      graph.ticks.length
    );
    const { skiaPath } = buildGraph(other.data, _width, _height, {
      minY: ticks[0],
      maxY: ticks[ticks.length - 1],
      curve: shape.curveNatural,
    });
    return { ticks, path: skiaPath };
  }, [graphs, graphIndex, graph, _width, _height]);

  // A range of ±BAND_SPREAD around the current graph
  const rangeBand = useMemo(() => {
    const spread = (graph.maxY - graph.minY) * BAND_SPREAD;
    const xs = graph.data.map(([x]) => x);
    return buildBandPath(
      graph.data.map(([x, y]) => [x, y - spread, y + spread]),
      _width,
      _height,
      {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: graph.minY,
        maxY: graph.maxY,
        curve: shape.curveMonotoneX,
      }
    );
  }, [graph, _width, _height]);

  // Area fill needs a static path, so it shows the current graph without the morph
  const linePaths: LinePath[] = showMultiple
    ? paths.map((x) => ({
        id: x.id,
        path: x.path,
        color: x.color,
        fillOpacity: showFill ? 0.2 : undefined,
      }))
    : [
        {
          id: 'main',
          path: showFill ? graph.skiaPath : path,
          color: Colors.primary,
          stops: showBands ? stops : undefined,
          fillOpacity: showFill ? 0.3 : undefined,
        },
        ...(showSecondAxis
          ? [{ id: 'second', path: secondAxis.path, color: SECOND_AXIS_COLOR }]
          : []),
      ];

  if (font === null) return <View style={styles.container} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.section}>Data</Text>
      <View style={styles.chips}>
        <Chip label="Change graph" onPress={_onChangeGraph} />
        <Chip
          label="Multiple"
          active={showMultiple}
          onPress={() => setShowMultiple((old) => !old)}
        />
        <Chip
          label={isContinuous ? 'Continuous' : 'Discrete'}
          active
          onPress={() => setContinous((old) => !old)}
        />
        <Chip
          label="Background"
          active={showBackground}
          onPress={() => setShowBackground((old) => !old)}
        />
      </View>
      <Text style={styles.section}>Primitives</Text>
      <View style={styles.chips}>
        <Chip
          label="Y axis (nice ticks)"
          active={showAxis}
          onPress={() => setShowAxis((old) => !old)}
        />
        <Chip
          label="Area fill"
          active={showFill}
          onPress={() => setShowFill((old) => !old)}
        />
        <Chip
          label="Band colours"
          active={showBands}
          onPress={() => setShowBands((old) => !old)}
        />
        <Chip
          label="Scroll-friendly cursor"
          active={scrollable}
          onPress={() => setScrollable((old) => !old)}
        />
        <Chip
          label="Second axis"
          active={showSecondAxis}
          onPress={() => setShowSecondAxis((old) => !old)}
        />
        <Chip
          label="Range band"
          active={showRange}
          onPress={() => setShowRange((old) => !old)}
        />
      </View>

      <View style={styles.textContainer}>
        {showMultiple ? (
          paths.map((_path, i) => (
            <View key={_path.id}>
              <Text style={{ color: _path.color }}>{_path.id}</Text>
              <ReTextInt key={i} style={styles.value} text={_path.value} />
            </View>
          ))
        ) : (
          <ReTextInt style={styles.value} text={cursorY} />
        )}
      </View>
      <GestureDetector gesture={gesture}>
        <Canvas
          style={[
            styles.chartContainer,
            { width, height: GRAPH_HEIGHT + TOP_PAD * 2 },
          ]}
        >
          {showBackground ? (
            <Rect
              width={width}
              height={GRAPH_HEIGHT + TOP_PAD * 2}
              color={Colors.secondary}
              opacity={0.15}
            />
          ) : null}
          <LinePlot
            height={GRAPH_HEIGHT}
            offsetX={PADDING_HORIZONTAL}
            offsetY={TOP_PAD}
            paths={linePaths}
            background={
              <>
                {showRange ? (
                  <Path path={rangeBand} color={Colors.secondary} opacity={0.18} />
                ) : null}
                {showAxis ? (
                <YAxis
                  width={_width}
                  height={GRAPH_HEIGHT}
                  font={font}
                  minY={graph.minY}
                  maxY={graph.maxY}
                  values={graph.ticks}
                  color="rgba(0,0,0,0.12)"
                  labelColor="hsl(209, 13%, 44%)"
                  labelAlign="left"
                  formatLabel={formatTick}
                />
                ) : null}
                {showAxis && showSecondAxis ? (
                  <AxisLabels
                    values={secondAxis.ticks}
                    minY={secondAxis.ticks[0]!}
                    maxY={secondAxis.ticks[secondAxis.ticks.length - 1]!}
                    height={GRAPH_HEIGHT}
                    width={_width}
                    font={font}
                    side="right"
                    color={SECOND_AXIS_COLOR}
                    formatLabel={formatTick}
                  />
                ) : null}
              </>
            }
          >
            {showFill || showBands ? null : renderDots(dots)}
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
                color={Colors.primary}
                strokeColor={Colors.white}
              />
            )}
          </LinePlot>
        </Canvas>
      </GestureDetector>
      <Text style={styles.hint}>
        {scrollable
          ? 'Scroll-friendly: drag sideways to move the cursor, vertically to scroll the page.'
          : 'Default: any drag on the chart moves the cursor, so the page cannot scroll from here.'}
        {showFill ? '\nArea fill draws a static path, so changing graph jumps instead of morphing.' : ''}
        {showSecondAxis ? '\nSecond axis: getAlignedTicks gives the other dataset as many round ticks as the left axis, so both share the gridlines.' : ''}
        {showRange ? '\nRange band: buildBandPath fills the area between a lower and an upper series.' : ''}
      </Text>
      <View style={styles.spacer} />
    </ScrollView>
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
  },
  content: {
    paddingTop: 12,
  },
  section: {
    marginHorizontal: PADDING_HORIZONTAL,
    marginTop: 4,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: 'hsl(209, 13%, 44%)',
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: PADDING_HORIZONTAL,
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: Colors.white,
  },
  textContainer: {
    marginLeft: 20,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 20,
  },
  value: {
    color: Colors.secondary,
    fontSize: 18,
  },
  hint: {
    marginHorizontal: PADDING_HORIZONTAL,
    marginTop: 10,
    fontSize: 12,
    color: 'hsl(209, 13%, 44%)',
  },
  spacer: {
    height: 600,
  },
});

export { LineChartScreen };
