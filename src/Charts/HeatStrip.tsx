import { Group, Rect, type Color } from 'react-native-skia';
import { memo, useMemo, type FC } from 'react';

export type HeatStripProps = {
  values: (number | undefined)[];
  width: number;
  height: number;
  color: Color;
  /** Number of cells the values are averaged into. */
  nbCells?: number;
  minValue?: number;
  maxValue?: number;
  /** Opacity of the lowest cell, so it stays visible. */
  minOpacity?: number;
  radius?: number;
};

/**
 * Opacity of each cell: values averaged per cell then scaled to [minOpacity, 1]
 * between minValue and maxValue (data min/max by default). Empty cells are 0.
 */
export const getHeatCells = function (
  values: (number | undefined)[],
  nbCells: number,
  options: { minValue?: number; maxValue?: number; minOpacity?: number } = {}
): number[] {
  const { minOpacity = 0.08 } = options;
  const cells: (number | undefined)[] = [];
  for (let i = 0; i < nbCells; i++) {
    const start = Math.floor((i * values.length) / nbCells);
    const end = Math.max(Math.floor(((i + 1) * values.length) / nbCells), start + 1);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end && j < values.length; j++) {
      const value = values[j];
      if (value !== undefined && Number.isFinite(value)) {
        sum += value;
        count++;
      }
    }
    cells.push(count > 0 ? sum / count : undefined);
  }
  let min = options.minValue ?? Infinity;
  let max = options.maxValue ?? -Infinity;
  if (options.minValue === undefined || options.maxValue === undefined)
    for (const cell of cells) {
      if (cell === undefined) continue;
      if (options.minValue === undefined && cell < min) min = cell;
      if (options.maxValue === undefined && cell > max) max = cell;
    }
  const span = max - min;
  return cells.map((cell) => {
    if (cell === undefined) return 0;
    const ratio = span > 0 ? Math.min(1, Math.max(0, (cell - min) / span)) : 1;
    return minOpacity + ratio * (1 - minOpacity);
  });
};

/** A one-row heatmap of a series over time: one cell per time bucket, darker = higher. */
const HeatStrip: FC<HeatStripProps> = function ({
  values,
  width,
  height,
  color,
  nbCells = 90,
  minValue,
  maxValue,
  minOpacity,
  radius = 3,
}) {
  const cells = useMemo(
    () => getHeatCells(values, nbCells, { minValue, maxValue, minOpacity }),
    [values, nbCells, minValue, maxValue, minOpacity]
  );
  const cellWidth = width / nbCells;
  const clip = useMemo(
    () => ({ rect: { x: 0, y: 0, width, height }, rx: radius, ry: radius }),
    [width, height, radius]
  );
  return (
    <Group clip={clip}>
      {cells.map((opacity, i) =>
        opacity > 0 ? (
          <Rect
            key={i}
            x={i * cellWidth}
            y={0}
            // Overlap by a hair: anti-aliased edges leave seams between cells
            width={cellWidth + 0.5}
            height={height}
            color={color}
            opacity={opacity}
          />
        ) : null
      )}
    </Group>
  );
};

const MemoHeatStrip = memo(HeatStrip);
MemoHeatStrip.displayName = 'HeatStrip';

export { MemoHeatStrip as HeatStrip };
