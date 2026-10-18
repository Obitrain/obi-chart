import { Skia, type SkPath } from 'react-native-skia';

export type ColorStop = { offset: number; color: string };

export type ValueBand = {
  /** Inclusive lower bound, open below when undefined. */
  from?: number;
  /** Upper bound, open above when undefined. */
  to?: number;
  color: string;
};

/**
 * Hard stops painting a vertical gradient band by band over a [minY, maxY] plot,
 * so a line takes the colour of the value range it crosses (e.g. heart-rate zones).
 * Values outside every band use `fallbackColor`.
 */
export const getBandStops = function (
  bands: ValueBand[],
  minY: number,
  maxY: number,
  fallbackColor: string
): ColorStop[] {
  const span = maxY - minY;
  if (span <= 0) return [];
  const toOffset = (value: number) =>
    Math.min(1, Math.max(0, (maxY - value) / span));

  // [top, bottom] offsets per band, top of the plot first
  const segments = bands
    .map((band) => ({
      top: toOffset(band.to ?? Infinity),
      bottom: toOffset(band.from ?? -Infinity),
      color: band.color,
    }))
    .filter((x) => x.bottom > x.top)
    .sort((a, b) => a.top - b.top);

  const stops: ColorStop[] = [];
  let cursor = 0;
  const push = (top: number, bottom: number, color: string) => {
    stops.push({ offset: top, color }, { offset: bottom, color });
  };
  for (const segment of segments) {
    const top = Math.max(segment.top, cursor);
    if (top > cursor) push(cursor, top, fallbackColor);
    if (segment.bottom > top) push(top, segment.bottom, segment.color);
    cursor = Math.max(cursor, segment.bottom);
  }
  if (cursor < 1) push(cursor, 1, fallbackColor);
  return stops;
};

/** `color` with its alpha replaced, as a Skia colour. */
export const withAlpha = function (color: string, alpha: number) {
  const _color = Skia.Color(color);
  // Skia.Color can return a shared array: copy before editing
  const out = new Float32Array(_color);
  out[3] = alpha;
  return out;
};

/** A copy of an open line path closed down to `height`, to fill the area under it. */
export const closeToBottom = function (path: SkPath, height: number): SkPath {
  if (path.countPoints() === 0) return path;
  const first = path.getPoint(0);
  const last = path.getLastPt();
  return Skia.PathBuilder.Make()
    .addPath(path)
    .lineTo(last.x, height)
    .lineTo(first.x, height)
    .close()
    .detach();
};
