import { buildGraph, getNiceTicks } from '@obitrain/charts';
import * as shape from 'd3-shape';
import { useMemo } from 'react';
import {
  makeMutable,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { MONTHLY_DATA, MONTHLY_DATA_2 } from '../../data';

const textToString = function (value: number) {
  'worklet';
  return value.toFixed(0).toString();
};

export const useShareNumberToStr = function (
  initValue: number = 0,
  fmtWl?: (value: number) => string
): [SharedValue<number>, SharedValue<string>] {
  const _fmtFn = fmtWl ?? textToString;
  const value = useSharedValue<number>(initValue);
  const valueStr = useDerivedValue(() => {
    return _fmtFn(value.value);
  }, [value]);

  return [value, valueStr];
};

const DATASET_1 = MONTHLY_DATA.map((x, i) => [i, x.value] as [number, number]);
const DATASET_2 = MONTHLY_DATA_2.map(
  (x, i) => [i, x.value] as [number, number]
);

const yBounds = function (dataset: [number, number][]) {
  const values = dataset.map(([, y]) => y);
  const ticks = getNiceTicks(Math.min(...values), Math.max(...values), 5);
  return { ticks, minY: ticks[0], maxY: ticks[ticks.length - 1] };
};

export const useData = function (width: number, height: number) {
  // Each graph spans round tick bounds so `YAxis` gridlines land on its labels
  const data = useMemo(
    () =>
      (
        [
          [DATASET_1, shape.curveBumpX],
          [DATASET_1, shape.curveNatural],
          [DATASET_2, shape.curveNatural],
        ] as const
      ).map(([dataset, curve]) => {
        const { ticks, minY, maxY } = yBounds([...dataset]);
        return {
          ...buildGraph([...dataset], width, height, { curve, minY, maxY }),
          ticks,
        };
      }),
    [height, width]
  );
  const firstGraph = data[0];
  if (!firstGraph) throw new Error('No graph found');

  const maxNbPoints = Math.max(...data.map((x) => x.dataPoints.length));
  const dots = useMemo(() => {
    return Array.from({ length: maxNbPoints }).map((_x, i) => ({
      x: makeMutable(firstGraph.dataPoints[i]?.x ?? 0),
      y: makeMutable(firstGraph.dataPoints[i]?.y ?? 0),
      opacity: makeMutable(firstGraph.dataPoints[i] !== undefined ? 1 : 0),
    }));
  }, [firstGraph, maxNbPoints]);

  return { data, dots };
};
