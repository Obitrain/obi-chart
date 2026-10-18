import { Group, Path, Skia, type Color } from 'react-native-skia';
import { memo, useMemo, type FC } from 'react';

export type RingSegment = { value: number; color: Color };

export type RingProps = {
  segments: RingSegment[];
  size: number;
  strokeWidth: number;
  /** Gap between segments, in degrees. */
  gap?: number;
  /** Track drawn under the segments, e.g. when every value is 0. */
  trackColor?: Color;
};

export type RingArc = { start: number; sweep: number };

/**
 * Start/sweep angles (degrees, clockwise from 12 o'clock) of each value's share of the ring,
 * with `gap` degrees between non-empty segments. Empty values get a zero sweep.
 */
export const getRingArcs = function (values: number[], gap = 0): RingArc[] {
  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  const nonEmpty = values.filter((x) => x > 0).length;
  if (total <= 0) return values.map(() => ({ start: -90, sweep: 0 }));
  const _gap = nonEmpty > 1 ? gap : 0;
  const available = 360 - _gap * nonEmpty;
  let start = -90 + _gap / 2;
  return values.map((value) => {
    if (value <= 0) return { start, sweep: 0 };
    const sweep = (Math.max(0, value) / total) * available;
    const arc = { start, sweep };
    start += sweep + _gap;
    return arc;
  });
};

/** A donut chart: one arc per segment, proportional to its value. */
const Ring: FC<RingProps> = function ({
  segments,
  size,
  strokeWidth,
  gap = 3,
  trackColor,
}) {
  const paths = useMemo(() => {
    const inset = strokeWidth / 2;
    const oval = {
      x: inset,
      y: inset,
      width: size - strokeWidth,
      height: size - strokeWidth,
    };
    const arcs = getRingArcs(
      segments.map((x) => x.value),
      gap
    );
    return {
      track: Skia.PathBuilder.Make().addOval(oval).detach(),
      arcs: arcs.map(({ start, sweep }) => {
        const builder = Skia.PathBuilder.Make();
        if (sweep > 0) builder.addArc(oval, start, sweep);
        return builder.detach();
      }),
    };
  }, [segments, size, strokeWidth, gap]);

  return (
    <Group>
      {trackColor !== undefined ? (
        <Path
          path={paths.track}
          style="stroke"
          strokeWidth={strokeWidth}
          color={trackColor}
        />
      ) : null}
      {paths.arcs.map((path, i) => (
        <Path
          key={i}
          path={path}
          style="stroke"
          strokeWidth={strokeWidth}
          color={segments[i]?.color}
        />
      ))}
    </Group>
  );
};

const MemoRing = memo(Ring);
MemoRing.displayName = 'Ring';

export { MemoRing as Ring };
