import * as shape from 'd3-shape';
import { useMemo } from 'react';
import { makeMutable } from 'react-native-reanimated';
import { buildGraph } from '../../../../src/Charts';
import { MONTHLY_DATA, MONTHLY_DATA_2 } from '../../data';

export const DATASET_1 = MONTHLY_DATA.map(
  (x, i) => [i, x.value] as [number, number]
);
export const DATASET_2 = MONTHLY_DATA_2.map(
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
