import { Ring, type RingSegment } from '@obitrain/charts';
import { Canvas } from 'react-native-skia';
import { useEffect, useRef, useState, type FC } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, Colors } from '../../components';
import { useDemo } from '../../hooks';

const PADDING = 20;
const SIZE = 200;
const ANIMATION_MS = 700;

const ZONES = [
  { label: 'Z1 Recovery', color: '#7e8fa0' },
  { label: 'Z2 Endurance', color: Colors.primary },
  { label: 'Z3 Tempo', color: Colors.secondary },
  { label: 'Z4 Threshold', color: '#e3a33b' },
  { label: 'Z5 VO2max', color: Colors.error },
];

const PRESETS: { label: string; values: number[] }[] = [
  { label: 'Endurance ride', values: [8, 42, 7, 2, 1] },
  { label: 'Intervals', values: [10, 18, 9, 14, 9] },
  { label: 'Race', values: [2, 6, 15, 24, 13] },
  { label: 'Empty', values: [0, 0, 0, 0, 0] },
];

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Tweens `target` on the JS thread: Ring rebuilds its arcs from the values each frame. */
const useTweenedValues = function (target: number[]) {
  const [values, setValues] = useState(target);
  const fromRef = useRef(target);
  const currentRef = useRef(target);

  useEffect(() => {
    fromRef.current = currentRef.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / ANIMATION_MS);
      const k = easeInOut(t);
      const next = target.map(
        (x, i) => (fromRef.current[i] ?? 0) + (x - (fromRef.current[i] ?? 0)) * k
      );
      currentRef.current = next;
      setValues(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return values;
};

const RingScreen: FC = function () {
  const [preset, setPreset] = useState(0);
  const [gap, setGap] = useState(3);
  const [strokeWidth, setStrokeWidth] = useState(22);
  const [showTrack, setShowTrack] = useState(true);

  const target = PRESETS[preset]!.values;
  const values = useTweenedValues(target);
  const total = target.reduce((a, b) => a + b, 0);
  const segments: RingSegment[] = ZONES.map((zone, i) => ({
    value: values[i] ?? 0,
    color: zone.color,
  }));

  useDemo([
    { at: 800, run: () => setPreset(1) },
    { at: 2200, run: () => setPreset(2) },
    { at: 3600, run: () => setPreset(0) },
  ]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>Session</Text>
      <View style={styles.chips}>
        {PRESETS.map((x, i) => (
          <Chip
            key={x.label}
            label={x.label}
            active={preset === i}
            onPress={() => setPreset(i)}
          />
        ))}
      </View>
      <Text style={styles.section}>Style</Text>
      <View style={styles.chips}>
        {[0, 3, 8].map((x) => (
          <Chip
            key={`gap${x}`}
            label={`Gap ${x}°`}
            active={gap === x}
            onPress={() => setGap(x)}
          />
        ))}
        {[10, 22, 40].map((x) => (
          <Chip
            key={`w${x}`}
            label={`Width ${x}`}
            active={strokeWidth === x}
            onPress={() => setStrokeWidth(x)}
          />
        ))}
        <Chip
          label="Track"
          active={showTrack}
          onPress={() => setShowTrack((old) => !old)}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.ringContainer}>
          <Canvas style={{ width: SIZE, height: SIZE }}>
            <Ring
              segments={segments}
              size={SIZE}
              strokeWidth={strokeWidth}
              gap={gap}
              trackColor={showTrack ? 'rgba(0,0,0,0.06)' : undefined}
            />
          </Canvas>
          <View style={styles.center} pointerEvents="none">
            <Text style={styles.total}>{total}</Text>
            <Text style={styles.caption}>min</Text>
          </View>
        </View>
        {ZONES.map((zone, i) => (
          <View key={zone.label} style={styles.legendRow}>
            <View style={styles.row}>
              <View style={[styles.swatch, { backgroundColor: zone.color }]} />
              <Text style={styles.legend}>{zone.label}</Text>
            </View>
            <Text style={styles.caption}>{Math.round(values[i] ?? 0)} min</Text>
          </View>
        ))}
      </View>
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
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  ringContainer: {
    alignSelf: 'center',
    width: SIZE,
    height: SIZE,
    marginBottom: 12,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  total: { fontSize: 28, fontWeight: '800', color: '#1c2733' },
  row: { flexDirection: 'row', alignItems: 'center' },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  legend: { fontSize: 14, color: '#1c2733' },
  swatch: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  caption: { fontSize: 12, color: 'hsl(209, 13%, 44%)' },
});

export { RingScreen };
