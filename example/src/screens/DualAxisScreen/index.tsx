import {
  AxisLabels,
  YAxis,
  buildBandPath,
  buildGraph,
  getAlignedTicks,
  type BandDatum,
} from '@obitrain/charts';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Path,
  Rect,
  matchFont,
  useFont,
} from 'react-native-skia';
import * as shape from 'd3-shape';
import { useMemo, useState, type FC } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, Colors } from '../../components';
import { useDimensions } from '../../hooks';

const PADDING = 20;
const CARD_PADDING = 12;
const SIDE = 30;
const HEIGHT = 200;
const TOP_PAD = 10;
const SECONDARY = 'rgb(125, 130, 184)';

// Two deterministic series sharing x (0..40) in different units, and a range around series A
const N = 40;
const NOW = 24;
const SERIES_A: [number, number][] = Array.from({ length: NOW + 1 }, (_, i) => [
  i,
  62 + (i <= 13 ? (1.25 * i) / 13 : 1.25 + (i - 13) * 0.46) + Math.sin(i) * 0.2,
]);
const SERIES_B: [number, number][] = Array.from({ length: NOW + 1 }, (_, i) => [
  i,
  26 - i * 0.12 + Math.sin(i / 2) * 0.6,
]);
const range = (x: number): BandDatum => {
  const k = Math.min(x, 13) / 13;
  const after = Math.max(x - 13, 0) / 27;
  return [x, 62 + 0.5 * k + after * 11, 62 + 2 * k + after * 14];
};
const RANGE_PAST = Array.from({ length: NOW + 1 }, (_, i) => range(i));
const RANGE_FUTURE = Array.from({ length: N - NOW + 1 }, (_, i) => range(NOW + i));

const TICK_COUNTS = [3, 4, 5, 6];

const DualAxisScreen: FC = function () {
  const { width } = useDimensions();
  const [count, setCount] = useState(4);
  const [showSecond, setShowSecond] = useState(true);
  const [showBand, setShowBand] = useState(true);

  // matchFont is not available on web: fall back to a bundled typeface there
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

  const canvasWidth = width - (PADDING + CARD_PADDING) * 2;
  const padL = showSecond ? SIDE : 0;
  const plotWidth = canvasWidth - padL - SIDE;

  const chart = useMemo(() => {
    const aValues = SERIES_A.map((x) => x[1]);
    if (showBand)
      for (const [, low, high] of [...RANGE_PAST, ...RANGE_FUTURE])
        aValues.push(low, high);
    const aTicks = getAlignedTicks(Math.min(...aValues), Math.max(...aValues), count);
    const bValues = SERIES_B.map((x) => x[1]);
    const bTicks = getAlignedTicks(Math.min(...bValues), Math.max(...bValues), count);
    const config = (ticks: number[]) => ({
      minX: 0,
      maxX: N,
      minY: ticks[0],
      maxY: ticks[ticks.length - 1],
    });
    return {
      aTicks,
      bTicks,
      a: buildGraph(SERIES_A, plotWidth, HEIGHT, { ...config(aTicks), curve: shape.curveMonotoneX }),
      b: buildGraph(SERIES_B, plotWidth, HEIGHT, { ...config(bTicks), curve: shape.curveMonotoneX }),
      past: buildBandPath(RANGE_PAST, plotWidth, HEIGHT, config(aTicks)),
      future: buildBandPath(RANGE_FUTURE, plotWidth, HEIGHT, config(aTicks)),
      nowX: (NOW / N) * plotWidth,
    };
  }, [count, showBand, plotWidth]);

  const fmt = (x: number) => `${Math.round(x * 10) / 10}`;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>Ticks per axis</Text>
      <View style={styles.chips}>
        {TICK_COUNTS.map((x) => (
          <Chip key={x} label={`${x}`} active={count === x} onPress={() => setCount(x)} />
        ))}
      </View>
      <Text style={styles.section}>Layers</Text>
      <View style={styles.chips}>
        <Chip
          label="Second axis"
          active={showSecond}
          onPress={() => setShowSecond((old) => !old)}
        />
        <Chip
          label="Range band"
          active={showBand}
          onPress={() => setShowBand((old) => !old)}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: Colors.primary }]}>○ Series A</Text>
          {showSecond ? (
            <Text style={[styles.legendText, { color: SECONDARY }]}>◇ Series B</Text>
          ) : null}
          {showBand ? (
            <Text style={[styles.legendText, { color: Colors.secondary }]}>▭ Range of A</Text>
          ) : null}
        </View>
        {font ? (
          <Canvas style={{ width: canvasWidth, height: HEIGHT + TOP_PAD * 2 }}>
            <Group transform={[{ translateY: TOP_PAD }]}>
              <Group transform={[{ translateX: padL }]}>
                <YAxis
                  width={plotWidth}
                  height={HEIGHT}
                  font={font}
                  minY={chart.aTicks[0]!}
                  maxY={chart.aTicks[chart.aTicks.length - 1]!}
                  values={chart.aTicks}
                  color="rgba(0,0,0,0.12)"
                  showLabels={false}
                />
              </Group>
              <Group transform={[{ translateX: showSecond ? 0 : padL + plotWidth + 4 }]}>
                <AxisLabels
                  values={chart.aTicks}
                  minY={chart.aTicks[0]!}
                  maxY={chart.aTicks[chart.aTicks.length - 1]!}
                  height={HEIGHT}
                  width={SIDE - 4}
                  font={font}
                  side={showSecond ? 'left' : 'right'}
                  color={Colors.primary}
                  formatLabel={fmt}
                />
              </Group>
              {showSecond ? (
                <Group transform={[{ translateX: padL + plotWidth + 4 }]}>
                  <AxisLabels
                    values={chart.bTicks}
                    minY={chart.bTicks[0]!}
                    maxY={chart.bTicks[chart.bTicks.length - 1]!}
                    height={HEIGHT}
                    width={SIDE - 4}
                    font={font}
                    side="right"
                    color={SECONDARY}
                    formatLabel={fmt}
                  />
                </Group>
              ) : null}
              <Group transform={[{ translateX: padL }]}>
                {showBand ? (
                  <>
                    <Path path={chart.past} color={Colors.secondary} opacity={0.2} />
                    <Path path={chart.future} color={Colors.secondary} opacity={0.1} />
                    <Path
                      path={chart.future}
                      style="stroke"
                      strokeWidth={1}
                      color={Colors.secondary}
                      opacity={0.6}
                    >
                      <DashPathEffect intervals={[3, 3]} />
                    </Path>
                    <Rect x={chart.nowX} y={0} width={1} height={HEIGHT} color={Colors.secondary} />
                  </>
                ) : null}
                {showSecond ? (
                  <>
                    <Path path={chart.b.skiaPath} style="stroke" strokeWidth={2} color={SECONDARY} />
                    {chart.b.dataPoints.map((p, i) => (
                      <Group
                        key={`b${i}`}
                        transform={[{ translateX: p.x }, { translateY: p.y }, { rotate: Math.PI / 4 }]}
                      >
                        <Rect x={-3} y={-3} width={6} height={6} color="white" />
                        <Rect x={-3} y={-3} width={6} height={6} style="stroke" strokeWidth={1.5} color={SECONDARY} />
                      </Group>
                    ))}
                  </>
                ) : null}
                <Path path={chart.a.skiaPath} style="stroke" strokeWidth={2} color={Colors.primary} />
                {chart.a.dataPoints.map((p, i) => (
                  <Group key={`a${i}`}>
                    <Circle cx={p.x} cy={p.y} r={3.5} color="white" />
                    <Circle cx={p.x} cy={p.y} r={3.5} style="stroke" strokeWidth={1.5} color={Colors.primary} />
                  </Group>
                ))}
              </Group>
            </Group>
          </Canvas>
        ) : null}
      </View>
      <Text style={styles.hint}>
        getAlignedTicks gives both axes exactly {count} round ticks, so they share one set of
        gridlines; AxisLabels prints each scale on its side. buildBandPath fills the range
        between a lower and an upper series, dashed after the vertical marker.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: 12 },
  section: {
    marginHorizontal: PADDING,
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
    marginHorizontal: PADDING,
    marginBottom: 12,
  },
  card: {
    marginHorizontal: PADDING,
    marginBottom: 12,
    padding: CARD_PADDING,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  legendText: { fontSize: 12, fontWeight: '700' },
  hint: {
    marginHorizontal: PADDING,
    fontSize: 12,
    color: 'hsl(209, 13%, 44%)',
  },
});

export { DualAxisScreen };
