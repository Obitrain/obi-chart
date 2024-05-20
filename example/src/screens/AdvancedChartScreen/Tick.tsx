import { getPositionWl } from '@obitrain/charts';
import {
  Group,
  Line,
  Text,
  vec,
  type Color,
  type SkFont,
} from '@shopify/react-native-skia';
import React, { type FC } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const useLabelOpacity = function (
  label: string,
  translateX: SharedValue<number>,
  font: SkFont,
  maxWidth?: number
) {
  const labelWidth = font
    .getGlyphWidths(font.getGlyphIDs(label))
    .reduce((a, b) => a + b, 0);

  const opacity = useDerivedValue(() => {
    if (maxWidth === undefined) {
      return 1;
    }
    if (translateX.value < 0 || translateX.value + labelWidth > maxWidth)
      return 0;

    return 1;
  }, [labelWidth]);

  return opacity;
};

export type Props = {
  initPosition: SharedValue<number>;
  label: SharedValue<string>;
  scale: SharedValue<number>;
  focalX: SharedValue<number>;
  offsetX: SharedValue<number>;
  offsetY?: number;
  maxWidth?: number;
  font: SkFont;
  color?: Color;
};

const Tick: FC<Props> = function (props) {
  const {
    label,
    scale,
    focalX,
    offsetX,
    initPosition,
    maxWidth,
    font,
    color = 'black',
  } = props;
  const offsetY = props.offsetY ?? 0;
  const translateX = useDerivedValue(() => {
    return getPositionWl(
      initPosition.value,
      focalX.value,
      scale.value,
      offsetX.value
    );
  }, [initPosition, offsetX]);

  const transform = useDerivedValue(() => {
    return [{ translateX: translateX.value }];
  }, [translateX]);

  const opacity = useLabelOpacity(label.value, translateX, font, maxWidth);
  return (
    <Group color={color} transform={transform}>
      <Line p1={vec(0, 0)} p2={vec(0, offsetY + 10)} />
      <Text text={label} opacity={opacity} x={5} y={offsetY + 10} font={font} />
    </Group>
  );
};

export { Tick };
