import * as shape from 'd3-shape';
import { buildGraph } from 'obi-chart';
import { useMemo } from 'react';
import { makeMutable } from 'react-native-reanimated';
import { WEIGHTS } from '../../data';
import { getAxisTicks, getDateBoundaries, getEvenlySpacedData } from './utils';

const ALL_DATA = getEvenlySpacedData(WEIGHTS, 20);
const ALL_DATA_AXIS = getAxisTicks(
  WEIGHTS.map((x) => x[0]),
  'all'
);

const YEARLY_DATA = getEvenlySpacedData(WEIGHTS, 12);
const YEARLY_DATA_AXIS = getAxisTicks(
  WEIGHTS.map((x) => x[0]),
  'year'
);

console.log(getDateBoundaries(YEARLY_DATA.map((x) => x[0])));

export const useData = function (width: number, height: number) {
  // shape.curveBasis,

  const data = useMemo(
    () => [
      buildGraph(
        ALL_DATA.map((x) => [x[0].getTime(), x[1]]),
        width,
        height,
        {
          curve: shape.curveBumpX,
        }
      ),
      buildGraph(
        YEARLY_DATA.map((x) => [x[0].getTime(), x[1]]),
        width,
        height,
        {
          curve: shape.curveBumpX,
        }
      ),
    ],
    [height, width]
  );
  const firstGraph = data[0];
  if (firstGraph === undefined) throw new Error('No graph found');

  // Dots

  const maxNbPoints = Math.max(...data.map((x) => x.dataPoints.length));
  const dots = useMemo(() => {
    return Array.from({ length: maxNbPoints }).map((_x, i) => ({
      x: makeMutable(firstGraph.dataPoints[i]?.x ?? 0),
      y: makeMutable(firstGraph.dataPoints[i]?.y ?? 0),
      opacity: makeMutable(firstGraph.dataPoints[i] !== undefined ? 1 : 0),
    }));
  }, [firstGraph, maxNbPoints]);

  // Axis
  const scaleX = firstGraph.scaleX;
  const axisTicks = useMemo(() => {
    return ALL_DATA_AXIS.map(({ ts, label }) => ({
      x: makeMutable(scaleX(ts)),
      label: makeMutable(label),
      opacity: makeMutable(0),
    }));
  }, [scaleX]);

  return { data, dots, axisTicks };
};
