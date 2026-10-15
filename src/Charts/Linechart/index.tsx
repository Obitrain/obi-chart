import { Canvas, Group, Path, type SkPath } from 'react-native-skia';
import type { FC } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export type LinePath = {
  path: SkPath | SharedValue<SkPath>;
  color: string;
  id?: string;
};

export type LinePlotProps = {
  paths: LinePath[];
  offsetY?: number;
  offsetX?: number;
  strokeWidth?: number;
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
  background,
  children,
}) {
  return (
    <Group transform={[{ translateY: offsetY }, { translateX: offsetX }]}>
      {background}
      {paths.map((_path, i) => (
        <Path
          key={`${_path.id ?? i}`}
          style="stroke"
          {..._path}
          strokeWidth={strokeWidth}
          strokeJoin="round"
          strokeCap="round"
        />
      ))}
      {children}
    </Group>
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
        background={background}
      >
        {children}
      </LinePlot>
    </Canvas>
  );
};

export { LineChart, LinePlot };
