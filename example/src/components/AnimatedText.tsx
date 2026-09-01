import React, { useEffect, useState } from 'react';
import type { TextProps as RNTextProps, TextInputProps } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  type AnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';

// Taken from https://github.com/wcandillon/react-native-redash/blob/2cc3c56c03ca6bfbd0c1ea2b542da16dbd0bb282/src/ReText.tsx#L20

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black',
  },
});

interface TextProps extends Omit<TextInputProps, 'value' | 'style'> {
  text: SharedValue<string>;
  style?: AnimatedProps<RNTextProps>['style'];
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const ReText = (props: TextProps) => {
  const { style, text, ...rest } = props;

  const [initValue, setInitValue] = useState(() => text.value);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value,
    } as any;
  });

  useEffect(() => {
    setInitValue(text.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={initValue}
      style={[styles.baseStyle, style || undefined]}
      {...rest}
      {...{ animatedProps }}
    />
  );
};

interface TextIntProps extends Omit<TextInputProps, 'value' | 'style'> {
  text: SharedValue<number>;
  style?: AnimatedProps<RNTextProps>['style'];
  fmtWl?: (x: number) => string;
}

const textToString = function (value: number) {
  'worklet';
  return value.toFixed(0).toString();
};

const ReTextInt = (props: TextIntProps) => {
  const { style, text, fmtWl = textToString, ...rest } = props;
  const [initValue, setInitValue] = useState(() => fmtWl(text.value));

  const _valueStr = useDerivedValue(() => {
    return fmtWl(text.value);
  }, [text]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: _valueStr.value,
    } as any;
  });

  useEffect(() => {
    setInitValue(fmtWl(text.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={initValue}
      style={[styles.baseStyle, style || undefined]}
      {...rest}
      {...{ animatedProps }}
    />
  );
};

export { ReText, ReTextInt };
