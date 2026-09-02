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

// `demo` is set by the obichart://<screen>?demo=1 deep links (see useDemo).
type DemoParams = { demo?: string } | undefined;

export type RootStackParamList = {
  Home: undefined;
  BottomAxisScreen: DemoParams;
  LineChartScreen: DemoParams;
  ZoomableLineChartScreen: DemoParams;
  TestScreen: undefined;
  DotsScreen: DemoParams;
  AdvancedChartScreen: DemoParams;
};

export type RNFC<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type DRNFC<Screen extends keyof RootStackParamList> = DrawerScreenProps<
  RootStackParamList,
  Screen
>;
