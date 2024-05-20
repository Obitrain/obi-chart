import { buildGraph, type AnimatedDot } from '@obitrain/charts';
import * as shape from 'd3-shape';
import { useMemo } from 'react';
import { makeMutable, type SharedValue } from 'react-native-reanimated';
import { WEIGHTS } from '../../data';
import { getAxisTicks, getEvenlySpacedData } from './utils';

export type AnimatedTick = {
  label: SharedValue<string>;
  x: SharedValue<number>;
};

const ALL_DATA = getEvenlySpacedData(WEIGHTS, 20);
const ALL_DATA_TICKS = getAxisTicks(
  WEIGHTS.map((x) => x[0]),
  'all'
);

const YEARLY_DATA = getEvenlySpacedData(WEIGHTS, 12, 'year');
const YEARLY_DATA_TICKS = getAxisTicks(
  WEIGHTS.map((x) => x[0]),
  'year'
);

const _DATA = [ALL_DATA, YEARLY_DATA];
const _TICKS = [ALL_DATA_TICKS, YEARLY_DATA_TICKS];

export const useData = function (width: number, height: number) {
  // shape.curveBasis,

  const graphs = useMemo(
    () =>
      _DATA.map((x) =>
        buildGraph(
          x.map((_item) => [_item[0].getTime(), _item[1]]),
          width,
          height,
          { curve: shape.curveBumpX }
        )
      ),
    [height, width]
  );
  const axesX: AnimatedTick[][] = useMemo(() => {
    return _TICKS.map((t, i) => {
      let _graph = graphs[i];
      if (_graph === undefined) throw new Error('No graph found');
      return t.map(({ ts, label }) => ({
        label: makeMutable(label),
        x: makeMutable(_graph!.scaleX(ts)),
        opacity: makeMutable(0),
      }));
    });
  }, [graphs]);

  const z = useMemo(() => {
    return _TICKS.map((t, i) => {
      let _graph = graphs[i];
      if (_graph === undefined) throw new Error('No graph found');
      return t.map(({ ts, label }) => ({
        label: label,
        x: _graph!.scaleX(ts),
        opacity: 0,
      }));
    });
  }, [graphs]);

  console.log(z[1]);

  const firstGraph = graphs[0];
  if (firstGraph === undefined) throw new Error('No graph found');

  // Dots
  const maxNbPoints = Math.max(...graphs.map((x) => x.dataPoints.length));
  const dots: AnimatedDot[] = useMemo(() => {
    return Array.from({ length: maxNbPoints }).map((_x, i) => ({
      x: makeMutable(firstGraph.dataPoints[i]?.x ?? 0),
      y: makeMutable(firstGraph.dataPoints[i]?.y ?? 0),
      opacity: makeMutable(firstGraph.dataPoints[i] !== undefined ? 1 : 0),
    }));
  }, [firstGraph, maxNbPoints]);

  const domains = graphs.map((g) => g.scaleY.domain());

  return { graphs, dots, axesX, yDomains: domains };
};
