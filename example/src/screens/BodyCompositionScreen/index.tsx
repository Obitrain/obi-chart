import {
  BottomAxis,
  Dots,
  ScalablePath,
  YAxis,
  useDotsTransition,
  useScalableGesture,
  useUpdateAxis,
} from '@obitrain/charts';
import {
  Canvas,
  Group,
  matchFont,
  useFont,
  Text as SkiaText,
} from '@shopify/react-native-skia';
import { useCallback, useMemo, useState, type FC } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useDimensions } from '../../hooks';
import {
  BANDS,
  BAND_SCALES,
  DAY_MS,
  FAT,
  MAX_TS,
  MAX_Y,
  MIN_TS,
  MUSCLE,
  TOTAL_DAYS,
  Y_TICKS,
  getDelta,
  useBodyCompositionData,
} from './data';
import { formatRange, getTicksForWindow } from './ticks';

export type Props = {};

const TOP_PAD = 24;
const AXIS_PAD = 34;
const LINE_WIDTH = 3;
const DOT_RADIUS = 5;
// Module-level: an inline array would be a new reference each render and
// would defeat the memo on every Tick
const TICK_DASH: [number, number] = [3, 4];

// Visible-window presets, the Withings period selector. `days: null` is the
// full range, which is what reset() already restores.
const PRESETS: { label: string; days: number | null }[] = [
  { label: 'Week', days: 7 },
  { label: 'Month', days: 30 },
  { label: 'Quarter', days: 91 },
  { label: '6 months', days: 182 },
  { label: 'Year', days: 365 },
  { label: 'All', days: null },
];

/** Index of the preset whose window matches `days`, within 15%. */
const matchPreset = function (days: number): number {
  const i = PRESETS.findIndex(
    (p) => p.days !== null && Math.abs(days - p.days) / p.days < 0.15
  );
  if (i !== -1) return i;
  return days >= TOTAL_DAYS * 0.85 ? PRESETS.length - 1 : -1;
};

type Theme = {
  background: string;
  muscle: string;
  fat: string;
  grid: string;
  label: string;
  text: string;
  accentBackground: string;
  accentText: string;
};

const DARK: Theme = {
  background: '#1E1E1E',
  muscle: '#5CD6BF',
  fat: '#A78BFA',
  grid: 'rgba(255, 255, 255, 0.2)',
  label: '#A5A5A8',
  text: '#F5F5F7',
  accentBackground: '#233366',
  accentText: '#C3D0FF',
};

const LIGHT: Theme = {
  background: '#FFFFFF',
  muscle: '#17A88F',
  fat: '#7C5CE6',
  grid: 'rgba(0, 0, 0, 0.14)',
  label: '#6B6B70',
  text: '#141416',
  accentBackground: '#E4E9FF',
  accentText: '#2B3F9E',
};

const translateWl = function (position: number) {
  'worklet';
  return withTiming(position, { duration: 350 });
};

const formatDelta = function (delta: number | null) {
  if (delta === null) return '—';
  const abs = Math.abs(delta).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${delta >= 0 ? '+' : '−'}${abs}%`;
};

const BodyCompositionScreen: FC<Props> = function ({}) {
  const { width, height } = useDimensions();
  const systemScheme = useColorScheme();
  const [scheme, setScheme] = useState<'light' | 'dark'>(
    systemScheme === 'light' ? 'light' : 'dark'
  );
  const theme = scheme === 'dark' ? DARK : LIGHT;

  const graphWidth = width - 32;
  const graphHeight = Math.max(240, height - 330);
  const canvasHeight = TOP_PAD + graphHeight + AXIS_PAD;

  // matchFont is not available on web: fall back to a bundled typeface there
  const webFont = useFont(
    require('../../../assets/fonts/SpaceMono-Regular.ttf'),
    11
  );
  const font = useMemo(
    () =>
      Platform.OS === 'web'
        ? webFont
        : matchFont({
            fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
            fontSize: 11,
          }),
    [webFont]
  );

  const { muscleGraphs, fatGraphs, muscleDots, fatDots } =
    useBodyCompositionData(graphWidth, graphHeight);

  const { scale, focalX, offsetX, pinchGesture, panGesture, reset } =
    useScalableGesture({ width: graphWidth });

  const musclePath = useSharedValue(muscleGraphs[0]!.skiaPath);
  const fatPath = useSharedValue(fatGraphs[0]!.skiaPath);

  // Swap to finer buckets when zooming in (years -> months -> weeks -> days)
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
    return BANDS.map((band) =>
      getTicksForWindow(MIN_TS, MAX_TS, band.ticks).map((t) => ({
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
    preset: PRESETS.length - 1,
  }));

  const updateTicks = useCallback(
    (x0: number, x1: number, band: number) => {
      const scaleX = muscleGraphs[0]!.scaleX;
      const all = allBandTicks[band]!;
      if (band < BANDS.length - 1) {
        // Year and month ticks are few enough to always render in full: a
        // stable array identity means no re-render at all while panning
        setTicks(all);
      } else {
        // Weekly ticks: slice one window beyond each side so panning stays covered
        const buffer = x1 - x0;
        setTicks(
          all.filter((t) => t.x >= x0 - buffer && t.x <= x1 + buffer)
        );
      }
      const ts0 = Math.max(scaleX.invert(x0), MIN_TS);
      const ts1 = Math.min(scaleX.invert(x1), MAX_TS);
      setInfo({
        title: formatRange(ts0, ts1, BANDS[band]?.data ?? 'year'),
        muscle: getDelta(MUSCLE, ts0, ts1),
        fat: getDelta(FAT, ts0, ts1),
        preset: matchPreset((ts1 - ts0) / DAY_MS),
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

  // Pin the most recent `days` to the right edge, which is where the offset
  // bounds already clamp a pan to, so this lands exactly on a reachable state
  const applyPreset = useCallback(
    (days: number | null) => {
      if (days === null) {
        reset();
        return;
      }
      const nextScale = Math.max(1, TOTAL_DAYS / days);
      focalX.value = 0;
      scale.value = nextScale;
      offsetX.value = graphWidth * (1 - nextScale);
    },
    [reset, focalX, scale, offsetX, graphWidth]
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
          r={DOT_RADIUS + 1}
          shape="diamond"
          color={theme.fat}
          fillColor={theme.background}
          strokeWidth={2}
          width={graphWidth}
          {...{ scale, focalX, offsetX }}
        />
        <Dots
          dots={muscleDots}
          r={DOT_RADIUS}
          color={theme.muscle}
          fillColor={theme.background}
          strokeWidth={2}
          width={graphWidth}
          {...{ scale, focalX, offsetX }}
        />
      </>
    ),
    [fatDots, muscleDots, graphWidth, scale, focalX, offsetX, theme]
  );

  const container = [styles.container, { backgroundColor: theme.background }];
  if (font === null) return <View style={container} />;

  return (
    <View style={container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          ‹ {info.title} ›
        </Text>
        <Pressable
          onPress={() => setScheme(scheme === 'dark' ? 'light' : 'dark')}
          hitSlop={12}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
        >
          <Text style={[styles.schemeToggle, { color: theme.label }]}>
            {scheme === 'dark' ? '☀' : '☾'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendHead}>
            <View style={[styles.legendRing, { borderColor: theme.muscle }]} />
            <Text style={[styles.legendLabel, { color: theme.label }]}>
              MUSCLE
            </Text>
          </View>
          <Text style={[styles.legendValue, { color: theme.text }]}>
            {formatDelta(info.muscle)}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendHead}>
            <View style={[styles.legendDiamond, { borderColor: theme.fat }]} />
            <Text style={[styles.legendLabel, { color: theme.label }]}>
              BODY FAT
            </Text>
          </View>
          <Text style={[styles.legendValue, { color: theme.text }]}>
            {formatDelta(info.fat)}
          </Text>
        </View>
      </View>

      <GestureDetector gesture={gesture}>
        <Canvas style={{ width: graphWidth, height: canvasHeight }}>
          <Group transform={[{ translateY: TOP_PAD }]}>
            <SkiaText
              text="%"
              x={graphWidth - 10}
              y={-10}
              font={font}
              color={theme.label}
            />
            <YAxis
              width={graphWidth}
              height={graphHeight}
              font={font}
              minY={0}
              maxY={MAX_Y}
              values={Y_TICKS}
              color={theme.grid}
              labelColor={theme.label}
            />
            <BottomAxis
              standalone={false}
              ticks={ticks}
              width={graphWidth}
              font={font}
              offsetY={graphHeight}
              tickLength={-graphHeight}
              dash={TICK_DASH}
              labelAlign="left"
              color={theme.grid}
              labelColor={theme.label}
              {...{ scale, focalX, offsetX }}
            />
            <ScalablePath
              path={fatPath}
              color={theme.fat}
              pathProps={{ strokeWidth: LINE_WIDTH }}
              {...{ scale, focalX, offsetX }}
            />
            <ScalablePath
              path={musclePath}
              color={theme.muscle}
              pathProps={{ strokeWidth: LINE_WIDTH }}
              {...{ scale, focalX, offsetX }}
            />
            {dotElements}
          </Group>
        </Canvas>
      </GestureDetector>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presets}
      >
        {PRESETS.map((preset, i) => {
          const active = info.preset === i;
          return (
            <Pressable
              key={preset.label}
              accessibilityRole="button"
              onPress={() => applyPreset(preset.days)}
              style={[
                styles.preset,
                active && { backgroundColor: theme.accentBackground },
              ]}
            >
              <Text
                style={[
                  styles.presetLabel,
                  { color: active ? theme.accentText : theme.label },
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  schemeToggle: {
    fontSize: 18,
    position: 'absolute',
    right: 0,
  },
  legend: {
    flexDirection: 'row',
    gap: 28,
    marginBottom: 4,
  },
  legendItem: {
    gap: 2,
  },
  legendHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  legendDiamond: {
    width: 9,
    height: 9,
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legendValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  presets: {
    gap: 8,
    paddingVertical: 16,
    paddingRight: 16,
  },
  preset: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export { BodyCompositionScreen };
