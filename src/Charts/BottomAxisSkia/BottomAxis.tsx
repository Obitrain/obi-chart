// ChartUtilsScreen.tsx
import { Canvas } from '@shopify/react-native-skia';
import React, { type FC } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type Animated from 'react-native-reanimated';
import { Tick } from './Tick';

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
  return (
    <Canvas style={style}>
      {/* Render ticks */}
      {/* <Line color="black" p1={vec(0, 0)} p2={vec(380, 0)} strokeWidth={2} /> */}
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
