import {
  buildGraph,
  getPaddedTicks,
  type AnimatedDot,
  type GraphData,
} from '@obitrain/charts';
import * as shape from 'd3-shape';
import { useMemo } from 'react';
import { makeMutable } from 'react-native-reanimated';
import { BODY_FAT } from '../../data';
import type { DataGranularity, TickGranularity } from './ticks';

export type Series = [ts: number, value: number][];

export const FAT: Series = BODY_FAT.map(([date, value]) => [
  date.getTime(),
  value,
]);

// The dataset has no muscle mass: mirror body fat so the two series move in
// opposite directions, like in the Withings app.
export const MUSCLE: Series = FAT.map(([ts, value]) => [ts, 95 - value]);

export const MIN_TS = FAT[0]![0];
export const MAX_TS = FAT[FAT.length - 1]![0];

export const DAY_MS = 24 * 3600 * 1000;
export const TOTAL_DAYS = (MAX_TS - MIN_TS) / DAY_MS;

/**
 * Zoom bands, from the widest visible window to the narrowest. Each band
 * buckets the data and labels the axis like the matching Withings period.
 */
export type Band = {
  data: DataGranularity;
  ticks: TickGranularity;
  /** The band applies while the visible window is longer than this. */
  minDays: number;
};
export const BANDS: Band[] = [
  { data: 'year', ticks: 'year', minDays: 730 },
  { data: 'month', ticks: 'month', minDays: 120 },
  { data: 'week', ticks: 'monthLong', minDays: 42 },
  { data: 'day', ticks: 'week', minDays: 0 },
];
export const BAND_SCALES = BANDS.map((band) =>
  band.minDays === 0 ? Infinity : TOTAL_DAYS / band.minDays
);

/** Y domain shared by both series: evenly spaced ticks up to a padded max. */
export const Y_TICKS = getPaddedTicks(
  Math.max(...FAT.map((d) => d[1]), ...MUSCLE.map((d) => d[1]))
);
export const MAX_Y = Y_TICKS[Y_TICKS.length - 1]!;

const bucketStart = function (ts: number, granularity: DataGranularity) {
  const d = new Date(ts);
  switch (granularity) {
    case 'year':
      return new Date(d.getFullYear(), 0, 1).getTime();
    case 'month':
      return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    case 'week': {
      const sinceMonday = (d.getDay() + 6) % 7;
      return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() - sinceMonday
      ).getTime();
    }
    case 'day':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
};

/** Mean value per bucket, placed at the mean timestamp of its measurements. */
export const aggregate = function (
  series: Series,
  granularity: DataGranularity
): Series {
  const buckets = new Map<number, { ts: number; value: number; n: number }>();
  for (const [ts, value] of series) {
    const key = bucketStart(ts, granularity);
    const bucket = buckets.get(key);
    if (bucket === undefined) buckets.set(key, { ts, value, n: 1 });
    else {
      bucket.ts += ts;
      bucket.value += value;
      bucket.n += 1;
    }
  }
  return [...buckets.values()].map((b) => [b.ts / b.n, b.value / b.n]);
};

const GRAPH_CONFIG = { minX: MIN_TS, maxX: MAX_TS, minY: 0, maxY: MAX_Y };

const buildBandGraphs = function (
  series: Series,
  width: number,
  height: number
): GraphData[] {
  return BANDS.map((band) =>
    buildGraph(aggregate(series, band.data), width, height, {
      ...GRAPH_CONFIG,
      curve: shape.curveLinear,
    })
  );
};

const makeDots = function (graph: GraphData, count: number): AnimatedDot[] {
  return Array.from({ length: count }).map((_, i) => ({
    x: makeMutable(graph.dataPoints[i]?.x ?? 0),
    y: makeMutable(graph.dataPoints[i]?.y ?? 0),
    opacity: makeMutable(graph.dataPoints[i] !== undefined ? 1 : 0),
  }));
};

export const useBodyCompositionData = function (
  width: number,
  height: number
) {
  const muscleGraphs = useMemo(
    () => buildBandGraphs(MUSCLE, width, height),
    [width, height]
  );
  const fatGraphs = useMemo(
    () => buildBandGraphs(FAT, width, height),
    [width, height]
  );
  // The densest band (raw days) bounds the dot pool shared by every band
  const maxNbPoints = Math.max(...fatGraphs.map((g) => g.dataPoints.length));
  const muscleDots = useMemo(
    () => makeDots(muscleGraphs[0]!, maxNbPoints),
    [muscleGraphs, maxNbPoints]
  );
  const fatDots = useMemo(
    () => makeDots(fatGraphs[0]!, maxNbPoints),
    [fatGraphs, maxNbPoints]
  );

  return { muscleGraphs, fatGraphs, muscleDots, fatDots };
};

/** Difference between the last and first value of `series` within a time window. */
export const getDelta = function (
  series: Series,
  ts0: number,
  ts1: number
): number | null {
  const visible = series.filter(([ts]) => ts >= ts0 && ts <= ts1);
  const first = visible[0];
  const last = visible[visible.length - 1];
  if (first === undefined || last === undefined) return null;
  return last[1] - first[1];
};
