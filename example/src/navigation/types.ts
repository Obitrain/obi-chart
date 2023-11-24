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
  //   Root: NavigatorScreenParams<RootTabParamList> | undefined;
  Home: undefined;
  FontsScreen: undefined;
  TextInputScreen: undefined;
  ButtonsScreen: undefined;
  LoadersScreen: undefined;
  EmptyViewScreen: undefined;
  IconsScreen: undefined;
  ColorsScreen: undefined;
  GradientsScreen: undefined;
  TopbarScreen: undefined;
  ViewPagerScreen: undefined;
  AvatarScreen: undefined;
  ChartsScreen: undefined;
  ChartUtilsScreen: undefined;
};

export type RNFC<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type DRNFC<Screen extends keyof RootStackParamList> = DrawerScreenProps<
  RootStackParamList,
  Screen
>;
