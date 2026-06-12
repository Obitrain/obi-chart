// ChartUtilsScreen.tsx
import { Canvas, type SkFont } from '@shopify/react-native-skia';
import { type FC } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { AxisLine } from './AxisLine';
import { Tick } from './Tick';

export type BottomAxisProps = {
  labels: string[];
  width: number;
  //   tickInterval: number;
  scale: SharedValue<number>;
  focalX: SharedValue<number>;
  offsetX: SharedValue<number>;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
  font: SkFont;
};

const BottomAxis: FC<BottomAxisProps> = function (props) {
  const { labels, scale, focalX, offsetX, style, width, font } = props;
  const offsetY = props.offsetY ?? 0;
  const tickInterval = labels.length > 1 ? width / (labels.length - 1) : 0;

  return (
    <Canvas style={style}>
      <AxisLine {...{ width, offsetY, focalX, scale, offsetX }} />
      {labels.map((_label, i) => (
        <Tick
          key={i}
          label={_label}
          initPosition={tickInterval * i}
          {...{ offsetX, offsetY, focalX, scale, font }}
        />
      ))}
    </Canvas>
  );
};

export { BottomAxis };
