import { buildGraph, type AnimatedDot, type GraphData } from '@obitrain/charts';
import * as shape from 'd3-shape';
import { useMemo } from 'react';
import { makeMutable } from 'react-native-reanimated';
import { BODY_FAT } from '../../data';

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
 * Zoom bands: the axis granularity (and data sampling) switches when the
 * visible window crosses these durations.
 */
export const GRANULARITIES = ['year', 'month', 'week', 'day'] as const;
export const BAND_SCALES = [
  TOTAL_DAYS / 730, // > 2 years visible -> years
  TOTAL_DAYS / 90, // 3 months - 2 years -> months
  TOTAL_DAYS / 21, // 3 weeks - 3 months -> weeks
  Infinity, // < 3 weeks -> days
];
const BAND_SAMPLES = [14, 40, 90, 120];

const sampleEvenly = function <T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  return Array.from(
    { length: max },
    (_, i) => arr[Math.round((i * (arr.length - 1)) / (max - 1))]!
  );
};

const buildBandGraphs = function (
  series: Series,
  width: number,
  height: number
): GraphData[] {
  return BAND_SAMPLES.map((nbPoints) =>
    buildGraph(sampleEvenly(series, nbPoints), width, height, {
      minX: MIN_TS,
      maxX: MAX_TS,
      minY: 0,
      maxY: 100,
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

  const maxNbPoints = Math.max(...BAND_SAMPLES.map((n) => Math.min(n, FAT.length)));
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
