import {
  Canvas,
  Group,
  LinearGradient,
  Path,
  vec,
  type SkPath,
} from 'react-native-skia';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { closeToBottom, withAlpha, type ColorStop } from './utils';

export type LinePath = {
  path: SkPath | SharedValue<SkPath>;
  color: string;
  id?: string;
  /** Vertical hard-stop gradient for the stroke (offsets 0 = top, 1 = bottom), e.g. from `getBandStops`. */
  stops?: ColorStop[];
  /** Fills the area under a static path with `color`, fading from this opacity to 0. */
  fillOpacity?: number;
};

export type LinePlotProps = {
  paths: LinePath[];
  offsetY?: number;
  offsetX?: number;
  strokeWidth?: number;
  /** Plot height: needed by `stops` and `fillOpacity`. */
  height?: number;
  /** Drawn under the paths, in plot coordinates. */
  background?: React.ReactNode;
  /** Drawn over the paths, in plot coordinates (e.g. cursors). */
  children?: React.ReactNode;
};

/** The plot drawn by `LineChart`, without its canvas, to compose inside a bigger one. */
const LinePlot: FC<LinePlotProps> = function ({
  paths,
  offsetX = 0,
  offsetY = 0,
  strokeWidth = 2,
  height,
  background,
  children,
}) {
  return (
    <Group transform={[{ translateY: offsetY }, { translateX: offsetX }]}>
      {background}
      {paths.map((_path, i) => (
        <LineSeries
          key={`${_path.id ?? i}`}
          line={_path}
          height={height}
          strokeWidth={strokeWidth}
        />
      ))}
      {children}
    </Group>
  );
};

const LineSeries: FC<{
  line: LinePath;
  height: number | undefined;
  strokeWidth: number;
}> = function ({ line, height, strokeWidth }) {
  const { path, color, stops, fillOpacity } = line;
  const isStatic = !('value' in path);
  const area = useMemo(
    () =>
      isStatic && fillOpacity !== undefined && height !== undefined
        ? closeToBottom(path as SkPath, height)
        : undefined,
    [isStatic, path, fillOpacity, height]
  );
  const fillColors = useMemo(
    () =>
      fillOpacity === undefined
        ? undefined
        : [withAlpha(color, fillOpacity), withAlpha(color, 0)],
    [color, fillOpacity]
  );
  const gradient =
    stops !== undefined && stops.length > 1 && height !== undefined ? (
      <LinearGradient
        start={vec(0, 0)}
        end={vec(0, height)}
        colors={stops.map((x) => x.color)}
        positions={stops.map((x) => x.offset)}
      />
    ) : null;
  return (
    <>
      {area && fillColors && height !== undefined ? (
        <Path path={area}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={fillColors}
          />
        </Path>
      ) : null}
      <Path
        path={path}
        color={color}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeJoin="round"
        strokeCap="round"
      >
        {gradient}
      </Path>
    </>
  );
};

type LineChartBaseProps = {
  height: number;
  width: number;
  style?: StyleProp<ViewStyle>;
  offsetY?: number;
  offsetX?: number;
  strokeWidth?: number;
  /** Forwarded to the Skia canvas: on Android an opaque canvas is a SurfaceView, the fastest path. */
  opaque?: boolean;
  background?: React.ReactNode;
  children?: React.ReactNode;
};

// Require at least one of `path` / `paths` at compile time
export type LineChartProps = LineChartBaseProps &
  (
    | { path: SkPath | SharedValue<SkPath>; paths?: LinePath[]; color?: string }
    | { paths: LinePath[]; path?: SkPath | SharedValue<SkPath>; color?: string }
  );

const LineChart: FC<LineChartProps> = function (props) {
  const {
    width,
    height,
    style,
    path,
    children,
    color,
    paths,
    background,
    offsetX,
    offsetY,
    strokeWidth,
    opaque,
  } = props;

  const _paths: LinePath[] =
    paths !== undefined
      ? paths
      : path !== undefined
      ? [{ path: path, color: color ?? 'red' }]
      : [];
  if (_paths.length === 0) {
    console.warn('Specify either a path or multiple paths.');
    return null;
  }
  return (
    <Canvas
      opaque={opaque}
      style={[
        {
          width,
          height,
        },
        style,
      ]}
    >
      <LinePlot
        paths={_paths}
        offsetX={offsetX}
        offsetY={offsetY}
        strokeWidth={strokeWidth}
        height={height}
        background={background}
      >
        {children}
      </LinePlot>
    </Canvas>
  );
};

export { LineChart, LinePlot };
