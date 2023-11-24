import React, { type FC } from 'react';
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  RectButton,
  type RectButtonProperties,
} from 'react-native-gesture-handler';
import { Colors } from './theme';

const styles = StyleSheet.create({
  container: {
    height: 80,
    width: 200,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 20,
    color: Colors.white,
  },
});

export type Props = RectButtonProperties & {
  label: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

const Button: FC<Props> = function (props) {
  const { label, style, labelStyle, ...rest } = props;
  return (
    <RectButton style={[styles.container, style]} {...rest}>
      <Text style={[styles.labelText, labelStyle]}>{label}</Text>
    </RectButton>
  );
};

export { Button };
