// ChartUtilsScreen.tsx
import { Canvas } from '@shopify/react-native-skia';
import React, { type FC } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import type Animated from 'react-native-reanimated';
import { AxisLine } from './AxisLine';
import { Tick } from './Tick';

export type AxisProps = {
  labels: string[];
  width: number;
  //   tickInterval: number;
  scale: Animated.SharedValue<number>;
  focalX: Animated.SharedValue<number>;
  offsetX: Animated.SharedValue<number>;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
};

const BottomAxis: FC<AxisProps> = function (props) {
  const { labels, scale, focalX, offsetX, style, width } = props;
  const offsetY = props.offsetY ?? 0;
  const tickInterval = width / (labels.length - 1);

  return (
    <Canvas style={style}>
      <AxisLine {...{ width, offsetY, focalX, scale, offsetX }} />
      {labels.map((_label, i) => (
        <Tick
          key={i}
          label={_label}
          initPosition={tickInterval * i}
          {...{ offsetX, offsetY, focalX, scale }}
        />
      ))}
    </Canvas>
  );
};

export { BottomAxis };
