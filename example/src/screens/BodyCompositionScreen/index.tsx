import {
  AxisLine,
  Dots,
  ScalablePath,
  Tick,
  YAxis,
  useDotsTransition,
  useScalableGesture,
  useUpdateAxis,
} from '@obitrain/charts';
import {
  Canvas,
  Group,
  useFont,
  Text as SkiaText,
} from '@shopify/react-native-skia';
import { useCallback, useMemo, useState, type FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useDimensions } from '../../hooks';
import {
  BAND_SCALES,
  FAT,
  GRANULARITIES,
  MAX_TS,
  MIN_TS,
  MUSCLE,
  getDelta,
  useBodyCompositionData,
} from './data';
import { formatRange, getTicksForWindow } from './ticks';

export type Props = {};

const GRAPH_HEIGHT = 240;
const TOP_PAD = 24;
const AXIS_PAD = 34;
const CANVAS_HEIGHT = TOP_PAD + GRAPH_HEIGHT + AXIS_PAD;

const Colors = {
  background: '#101013',
  card: '#1D1D21',
  muscle: '#4FD8C2',
  fat: '#A78BFA',
  grid: 'rgba(255, 255, 255, 0.12)',
  label: '#9B9BA1',
  text: '#F2F2F5',
  accent: '#3D4FC4',
};

const translateWl = function (position: number) {
  'worklet';
  return withTiming(position, { duration: 350 });
};

const formatDelta = function (delta: number | null) {
  if (delta === null) return '—';
  return `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}%`;
};

const BodyCompositionScreen: FC<Props> = function ({}) {
  const { width } = useDimensions();
  const graphWidth = width - 32;
  // matchFont is not available on web: load a bundled typeface instead
  const font = useFont(
    require('../../../assets/fonts/SpaceMono-Regular.ttf'),
    11
  );

  const { muscleGraphs, fatGraphs, muscleDots, fatDots } =
    useBodyCompositionData(graphWidth, GRAPH_HEIGHT);

  const { scale, focalX, offsetX, pinchGesture, panGesture, reset } =
    useScalableGesture({ width: graphWidth });

  const musclePath = useSharedValue(muscleGraphs[0]!.skiaPath);
  const fatPath = useSharedValue(fatGraphs[0]!.skiaPath);

  // Swap to denser data when zooming in (years -> months -> weeks -> days)
  const { currentIndex } = useUpdateAxis({
    scale,
    scales: BAND_SCALES,
    onScaleChange: (i) => {
      musclePath.value = muscleGraphs[i]!.skiaPath;
      fatPath.value = fatGraphs[i]!.skiaPath;
    },
  });

  const muscleDataPoints = useMemo(
    () => muscleGraphs.map((g) => g.dataPoints),
    [muscleGraphs]
  );
  const fatDataPoints = useMemo(
    () => fatGraphs.map((g) => g.dataPoints),
    [fatGraphs]
  );
  useDotsTransition({
    currentGraph: currentIndex,
    path: musclePath,
    dataPoints: muscleDataPoints,
    dots: muscleDots,
    translateWl,
  });
  useDotsTransition({
    currentGraph: currentIndex,
    path: fatPath,
    dataPoints: fatDataPoints,
    dots: fatDots,
    translateWl,
  });

  // Precompute every band's full tick set once: regenerating labels mid-pan
  // (Date + Intl calls) costs 10-50ms on the JS thread and reads as jank
  const allBandTicks = useMemo(() => {
    const scaleX = muscleGraphs[0]!.scaleX;
    return GRANULARITIES.map((granularity) =>
      getTicksForWindow(MIN_TS, MAX_TS, granularity).map((t) => ({
        x: scaleX(t.ts),
        label: t.label,
      }))
    );
  }, [muscleGraphs]);

  const [ticks, setTicks] = useState(() => allBandTicks[0]!);
  const [info, setInfo] = useState(() => ({
    title: formatRange(MIN_TS, MAX_TS, 'year'),
    muscle: getDelta(MUSCLE, MIN_TS, MAX_TS),
    fat: getDelta(FAT, MIN_TS, MAX_TS),
  }));

  const updateTicks = useCallback(
    (x0: number, x1: number, band: number) => {
      const scaleX = muscleGraphs[0]!.scaleX;
      const granularity = GRANULARITIES[band] ?? 'year';
      const all = allBandTicks[band]!;
      if (band <= 1) {
        // Years/months are few enough to always render in full: a stable
        // array identity means no re-render at all while panning
        setTicks(all);
      } else {
        // Slice one window beyond each side so panning stays covered
        const buffer = x1 - x0;
        setTicks(
          all.filter((t) => t.x >= x0 - buffer && t.x <= x1 + buffer)
        );
      }
      const ts0 = Math.max(scaleX.invert(x0), MIN_TS);
      const ts1 = Math.min(scaleX.invert(x1), MAX_TS);
      setInfo({
        title: formatRange(ts0, ts1, granularity),
        muscle: getDelta(MUSCLE, ts0, ts1),
        fat: getDelta(FAT, ts0, ts1),
      });
    },
    [muscleGraphs, allBandTicks]
  );

  // Regenerate the ticks when the zoom band changes or the visible
  // window moved by more than half its width
  const lastTickKey = useSharedValue(Number.NaN);
  useAnimatedReaction(
    () => {
      const s = scale.value;
      const x0 = (0 - focalX.value - offsetX.value) / s + focalX.value;
      const x1 =
        (graphWidth - focalX.value - offsetX.value) / s + focalX.value;
      const win = Math.max(x1 - x0, 1e-6);
      return {
        x0,
        x1,
        band: currentIndex.value,
        key: currentIndex.value * 1e6 + Math.round((2 * x0) / win),
      };
    },
    (cur) => {
      if (cur.key === lastTickKey.value) return;
      lastTickKey.value = cur.key;
      scheduleOnRN(updateTicks, cur.x0, cur.x1, cur.band);
    },
    [updateTicks, graphWidth]
  );

  const gesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, panGesture),
    [pinchGesture, panGesture]
  );

  // One path per series (instead of one component per dot) keeps the
  // UI-thread frame cost low while panning
  const dotElements = useMemo(
    () => (
      <>
        <Dots
          dots={fatDots}
          r={3.5}
          color={Colors.fat}
          fillColor={Colors.background}
          strokeWidth={1.5}
          width={graphWidth}
          {...{ scale, focalX, offsetX }}
        />
        <Dots
          dots={muscleDots}
          r={3.5}
          color={Colors.muscle}
          fillColor={Colors.background}
          strokeWidth={1.5}
          width={graphWidth}
          {...{ scale, focalX, offsetX }}
        />
      </>
    ),
    [fatDots, muscleDots, graphWidth, scale, focalX, offsetX]
  );

  if (font === null) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>‹ {info.title} ›</Text>
      <View style={styles.legend}>
        <View style={[styles.legendDot, { borderColor: Colors.muscle }]} />
        <Text style={styles.legendLabel}>Muscle</Text>
        <View style={[styles.legendDot, { borderColor: Colors.fat }]} />
        <Text style={styles.legendLabel}>Body fat</Text>
      </View>

      <GestureDetector gesture={gesture}>
        <Canvas style={{ width: graphWidth, height: CANVAS_HEIGHT }}>
          <Group transform={[{ translateY: TOP_PAD }]}>
            <SkiaText
              text="%"
              x={graphWidth - 10}
              y={-10}
              font={font}
              color={Colors.label}
            />
            <YAxis
              width={graphWidth}
              height={GRAPH_HEIGHT}
              font={font}
              minY={0}
              maxY={100}
              values={[20, 40, 60, 80, 100]}
              color={Colors.grid}
              labelColor={Colors.label}
            />
            {ticks.map((tick) => (
              <Tick
                key={tick.x}
                initPosition={tick.x}
                label={tick.label}
                font={font}
                offsetY={GRAPH_HEIGHT}
                tickLength={-GRAPH_HEIGHT}
                color={Colors.grid}
                labelColor={Colors.label}
                {...{ scale, focalX, offsetX }}
              />
            ))}
            <AxisLine
              width={graphWidth}
              offsetY={GRAPH_HEIGHT}
              color={Colors.grid}
              {...{ scale, focalX, offsetX }}
            />
            <ScalablePath
              path={fatPath}
              color={Colors.fat}
              {...{ scale, focalX, offsetX }}
            />
            <ScalablePath
              path={musclePath}
              color={Colors.muscle}
              {...{ scale, focalX, offsetX }}
            />
            {dotElements}
          </Group>
        </Canvas>
      </GestureDetector>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Muscle</Text>
          <Text style={styles.cardValue}>{formatDelta(info.muscle)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Body fat</Text>
          <Text style={styles.cardValue}>{formatDelta(info.fat)}</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Pinch to zoom: the axis switches years → months → weeks → days
      </Text>
      <Pressable style={styles.resetBtn} onPress={reset}>
        <Text style={styles.resetLabel}>Reset zoom</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: Colors.text,
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: Colors.background,
  },
  legendLabel: {
    color: Colors.label,
    fontSize: 13,
    marginRight: 12,
  },
  cards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardLabel: {
    color: Colors.label,
    fontSize: 13,
    marginBottom: 4,
  },
  cardValue: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    color: Colors.label,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  resetBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  resetLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

export { BodyCompositionScreen };
