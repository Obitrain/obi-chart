import { buildGraph, getPositionWl, type AnimatedDot } from '@obitrain/charts';
import * as shape from 'd3-shape';
import { useMemo } from 'react';
import {
  makeMutable,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
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

  const maxNbPoints = Math.max(...data.map((x) => x.dataPoints.length));
  const dots: AnimatedDot[] = useMemo(() => {
    return Array.from({ length: maxNbPoints }).map((_x, i) => ({
      x: makeMutable(firstGraph.dataPoints[i]?.x ?? 0),
      y: makeMutable(firstGraph.dataPoints[i]?.y ?? 0),
      opacity: makeMutable(firstGraph.dataPoints[i] !== undefined ? 1 : 0),
    }));
  }, [firstGraph, maxNbPoints]);

  return { data, dots };
};

/**
 * Zoom from one dot to another
 * @param fromDot
 * @param toDot
 * @param scale
 * @param focalX
 * @param offsetX
 * @param width
 */
export const zoomPeriod = function (
  fromDot: AnimatedDot,
  toDot: AnimatedDot,
  scale: SharedValue<number>,
  focalX: SharedValue<number>,
  offsetX: SharedValue<number>,
  width: number
) {
  'worklet';
  let fromDotPos = getPositionWl(
    fromDot.x.value,
    focalX.value,
    scale.value,
    offsetX.value
  );
  let toDotPos = getPositionWl(
    toDot.x.value,
    focalX.value,
    scale.value,
    offsetX.value
  );
  const _scale = (width * scale.value) / (toDotPos - fromDotPos);
  console.debug(
    `Zooming from ${fromDotPos} to ${toDotPos} with scale ${_scale}`
  );
  scale.value = withTiming(_scale, { duration: 1000 });
};
