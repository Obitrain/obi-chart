import React from 'react';
import type { TextProps as RNTextProps, TextInputProps } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';

// Taken from https://github.com/wcandillon/react-native-redash/blob/2cc3c56c03ca6bfbd0c1ea2b542da16dbd0bb282/src/ReText.tsx#L20

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black',
  },
});
Animated.addWhitelistedNativeProps({ text: true });

interface TextProps extends Omit<TextInputProps, 'value' | 'style'> {
  text: Animated.SharedValue<string>;
  style?: Animated.AnimateProps<RNTextProps>['style'];
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const ReText = (props: TextProps) => {
  const { style, text, ...rest } = props;
  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value,
    } as any;
  });
  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={text.value}
      style={[styles.baseStyle, style || undefined]}
      {...rest}
      {...{ animatedProps }}
    />
  );
};

export { ReText };
