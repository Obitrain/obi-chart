/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Home: undefined;
  BottomAxisScreen: undefined;
  LineChartScreen: undefined;
  ZoomableLineChartScreen: undefined;
};

export type RNFC<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type DRNFC<Screen extends keyof RootStackParamList> = DrawerScreenProps<
  RootStackParamList,
  Screen
>;
