import { HeatStrip } from '@obitrain/charts';
import { Canvas } from 'react-native-skia';
import { useMemo, useState, type FC } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, Colors } from '../../components';
import { useDimensions } from '../../hooks';

const PADDING = 20;
const STRIP_HEIGHT = 28;

// Deterministic series, 240 samples: a ramp, 3 plateaus, a decline
const SAMPLES = Array.from({ length: 240 }, (_, i) => {
  const t = i / 4;
  const plateau = t > 15 && t < 45 && (t - 15) % 10 < 5;
  const a =
    (t < 10 ? 105 + t * 3 : t > 50 ? 150 - (t - 50) * 3.5 : 138) +
    (plateau ? 26 : 0) +
    Math.sin(i / 3) * 3;
  const b =
    (t < 10 ? 120 + t * 8 : t > 50 ? 180 - (t - 50) * 8 : 190) +
    (plateau ? 110 : 0) +
    Math.sin(i / 2) * 18;
  // Drops out (undefined) every few samples
  const c = i % 37 < 4 ? undefined : 85 + (plateau ? 10 : 0) + Math.sin(i) * 4;
  return { a, b, c };
});

const SERIES = [
  { label: 'Series A', color: Colors.error, values: SAMPLES.map((x) => x.a) },
  { label: 'Series B', color: Colors.primary, values: SAMPLES.map((x) => x.b) },
  {
    label: 'Series C (with gaps)',
    color: Colors.secondary,
    values: SAMPLES.map((x) => x.c),
  },
];

const CELLS = [12, 30, 60, 120];

const HeatStripScreen: FC = function () {
  const { width } = useDimensions();
  const stripWidth = width - PADDING * 2;
  const [nbCells, setNbCells] = useState(60);
  const [fixedRange, setFixedRange] = useState(false);
  const [rounded, setRounded] = useState(true);

  // A fixed range compares strips; the default stretches each strip to its own min/max
  const ranges = useMemo(
    () => [
      { minValue: 90, maxValue: 190 },
      { minValue: 0, maxValue: 400 },
      { minValue: 60, maxValue: 110 },
    ],
    []
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>Cells</Text>
      <View style={styles.chips}>
        {CELLS.map((x) => (
          <Chip
            key={x}
            label={`${x}`}
            active={nbCells === x}
            onPress={() => setNbCells(x)}
          />
        ))}
      </View>
      <Text style={styles.section}>Options</Text>
      <View style={styles.chips}>
        <Chip
          label="Fixed range"
          active={fixedRange}
          onPress={() => setFixedRange((old) => !old)}
        />
        <Chip
          label="Rounded"
          active={rounded}
          onPress={() => setRounded((old) => !old)}
        />
      </View>
      {SERIES.map((series, i) => (
        <View key={series.label} style={styles.card}>
          <Text style={styles.title}>{series.label}</Text>
          <Canvas style={{ width: stripWidth - 24, height: STRIP_HEIGHT }}>
            <HeatStrip
              values={series.values}
              width={stripWidth - 24}
              height={STRIP_HEIGHT}
              color={series.color}
              nbCells={nbCells}
              radius={rounded ? 4 : 0}
              minValue={fixedRange ? ranges[i]!.minValue : undefined}
              maxValue={fixedRange ? ranges[i]!.maxValue : undefined}
            />
          </Canvas>
          <View style={styles.row}>
            <Text style={styles.caption}>start</Text>
            <Text style={styles.caption}>end</Text>
          </View>
        </View>
      ))}
      <Text style={styles.hint}>
        Values are averaged into {nbCells} cells, darker means higher. Empty
        cells (no data) stay transparent.
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
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#1c2733' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  caption: { fontSize: 11, color: 'hsl(209, 13%, 44%)' },
  hint: {
    marginHorizontal: PADDING,
    fontSize: 12,
    color: 'hsl(209, 13%, 44%)',
  },
});

export { HeatStripScreen };
