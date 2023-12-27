import {
  createDrawerNavigator,
  type DrawerNavigationOptions,
} from '@react-navigation/drawer';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import * as React from 'react';
import { Platform, type ColorSchemeName } from 'react-native';
import type { RootStackParamList } from './types';

import { Colors } from '../components/theme';
import * as Screens from '../screens';

const Drawer = createDrawerNavigator();

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <NavigationContainer
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

type ScreenName = keyof RootStackParamList;

type ScreenType = {
  name: ScreenName;
  component: React.ComponentType<any>;
  options?: DrawerNavigationOptions; // NativeStackNavigationOptions
};

const SCREENS: ScreenType[] = [
  {
    name: 'Home',
    component: Screens.HomeScreen,
    options: {
      title: 'Obi Chart Utils',
      drawerLabel: 'Home',
    },
  },
  {
    name: 'BottomAxisScreen',
    component: Screens.BottomAxisScreen,
    options: {
      title: 'Bottom Axis',
    },
  },
  {
    name: 'LineChartScreen',
    component: Screens.LineChartScreen,
    options: {
      title: 'Line chart',
    },
  },
  {
    name: 'ZoomableLineChartScreen',
    component: Screens.ZoomableLineChartScreen,
    options: {
      title: 'Zoomable Line chart',
    },
  },
];

const TOPBAR_DEFAULT_OPTIONS = Platform.select<DrawerNavigationOptions>({
  ios: {
    headerTintColor: Colors.primary,
    // headerTitleStyle: getTitleFontStyle({
    //   type: 'semi-bold',
    //   size: 'medium',
    // }),
  },
  default: {
    headerTintColor: Colors.primary,
  },
});

function RootNavigator() {
  const initRoute: ScreenName = __DEV__ ? 'BottomAxisScreen' : 'Home';
  return (
    <Drawer.Navigator
      screenOptions={{ ...TOPBAR_DEFAULT_OPTIONS }}
      initialRouteName={initRoute}
    >
      {SCREENS.map(({ name, component, options }) => (
        <Drawer.Screen
          key={name}
          name={name}
          component={component}
          options={options}
        />
      ))}
    </Drawer.Navigator>
  );
}
