// ChartUtilsScreen.tsx
import { Canvas, Line, vec } from '@shopify/react-native-skia';
import React, { type FC } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type Animated from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { Tick, getPositionWl } from './Tick';

export type AxisProps = {
  data: number[];
  tickInterval: number;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;
  offsetX: Animated.SharedValue<number>;
  yPosition?: number;
  style?: StyleProp<ViewStyle>;
};

const BottomAxis: FC<AxisProps> = function (props) {
  const { data, scale, focalX, offsetX, style, tickInterval } = props;
  const yPosition = props.yPosition ?? 0;

  const p1 = useDerivedValue(() => {
    const p1X = getPositionWl(
      0,
      tickInterval,
      focalX.value,
      scale.value,
      offsetX.value
    );
    return vec(p1X, yPosition);
  }, [tickInterval]);

  const p2 = useDerivedValue(() => {
    const p1X = getPositionWl(
      data.length - 1,
      tickInterval,
      focalX.value,
      scale.value,
      offsetX.value
    );
    return vec(p1X, yPosition);
  }, [tickInterval, data.length]);

  return (
    <Canvas style={style}>
      {/* Render ticks */}
      <Line
        color="black"
        p1={p1}
        p2={p2}
        strokeWidth={StyleSheet.hairlineWidth}
      />
      {data.map((v, i) => (
        <Tick
          key={i}
          index={i}
          value={v.toString()}
          scale={scale}
          focalX={focalX}
          tickInterval={tickInterval}
          offsetX={offsetX}
          yPosition={yPosition}
        />
      ))}
    </Canvas>
  );
};

export { BottomAxis };
