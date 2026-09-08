import {
  Canvas,
  type Color,
  type SkFont,
} from '@shopify/react-native-skia';
import { useMemo, type FC } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { AxisLine } from './AxisLine';
import { Tick } from './Tick';

/** A tick at an explicit position in graph space, as returned by a d3 scale. */
export type AxisTick = { x: number; label: string };

export type BottomAxisProps = {
  width: number;
  scale: SharedValue<number>;
  focalX: SharedValue<number>;
  offsetX: SharedValue<number>;
  font: SkFont;
  /**
   * Ticks at explicit positions, for a non-uniform axis (a time axis lands on
   * month starts or Mondays, not on even fractions). Takes precedence over `labels`.
   */
  ticks?: AxisTick[];
  /** Labels spread evenly across `width`. */
  labels?: string[];
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
  /** Renders its own Canvas by default; pass false to embed in an existing one. */
  standalone?: boolean;
  showAxisLine?: boolean;
  color?: Color;
  labelColor?: Color;
  /** Negative (e.g. -chartHeight) draws full-height gridlines above the axis. */
  tickLength?: number;
  strokeWidth?: number;
  dash?: [number, number];
  labelAlign?: 'center' | 'left';
  labelGap?: number;
  showLabels?: boolean;
};

const BottomAxis: FC<BottomAxisProps> = function (props) {
  const {
    labels,
    ticks,
    scale,
    focalX,
    offsetX,
    style,
    width,
    font,
    offsetY = 0,
    standalone = true,
    showAxisLine = true,
    color,
    labelColor,
    tickLength,
    strokeWidth,
    dash,
    labelAlign,
    labelGap,
    showLabels,
  } = props;

  const items = useMemo<AxisTick[]>(() => {
    if (ticks !== undefined) return ticks;
    if (labels === undefined) return [];
    const interval = labels.length > 1 ? width / (labels.length - 1) : 0;
    return labels.map((label, i) => ({ x: interval * i, label }));
  }, [ticks, labels, width]);

  // Callers naturally write `dash={[3, 4]}`; keying the memo on the values
  // keeps one reference so the memoized Ticks are not rebuilt every render
  const dashStart = dash?.[0];
  const dashEnd = dash?.[1];
  const dashIntervals = useMemo(
    () =>
      dashStart === undefined || dashEnd === undefined
        ? undefined
        : ([dashStart, dashEnd] as [number, number]),
    [dashStart, dashEnd]
  );

  const content = (
    <>
      {showAxisLine ? (
        <AxisLine
          {...{ width, offsetY, focalX, scale, offsetX, color, strokeWidth }}
        />
      ) : null}
      {items.map((tick) => (
        <Tick
          key={`${tick.x}:${tick.label}`}
          initPosition={tick.x}
          label={tick.label}
          dash={dashIntervals}
          {...{
            offsetX,
            offsetY,
            focalX,
            scale,
            font,
            color,
            labelColor,
            tickLength,
            strokeWidth,
            labelAlign,
            labelGap,
          }}
          showLabel={showLabels}
        />
      ))}
    </>
  );

  if (!standalone) return content;
  return <Canvas style={style}>{content}</Canvas>;
};

export { BottomAxis };
