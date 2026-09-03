import {
  createDrawerNavigator,
  type DrawerNavigationOptions,
} from '@react-navigation/drawer';
import {
  DarkTheme,
  DefaultTheme,
  DrawerActions,
  NavigationContainer,
  useNavigation,
  type LinkingOptions,
} from '@react-navigation/native';
import * as React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ColorSchemeName,
} from 'react-native';
import type { RootStackParamList } from './types';

import { Colors } from '../components/theme';
import * as Screens from '../screens';

// Metro 0.83+ fails to resolve @react-navigation/drawer's platform-specific
// toggle-drawer-icon@Nx.android.png variants, leaving the header with a
// broken (invisible) image. Render our own hamburger until Metro fixes it.
function HamburgerButton({ tintColor }: { tintColor?: string }) {
  const navigation = useNavigation();
  const color = tintColor ?? Colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Show navigation menu"
      hitSlop={8}
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={hamburgerStyles.button}
    >
      <View style={[hamburgerStyles.bar, { backgroundColor: color }]} />
      <View style={[hamburgerStyles.bar, { backgroundColor: color }]} />
      <View style={[hamburgerStyles.bar, { backgroundColor: color }]} />
    </Pressable>
  );
}

const hamburgerStyles = StyleSheet.create({
  button: {
    width: 24,
    height: 24,
    marginVertical: 8,
    marginHorizontal: 11,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bar: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
});

const Drawer = createDrawerNavigator();

// obichart://<path>?demo=1 — used by bin/capture-gifs.sh
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['obichart://'],
  config: {
    screens: {
      Home: '',
      BottomAxisScreen: 'bottom-axis',
      LineChartScreen: 'line-chart',
      ZoomableLineChartScreen: 'zoomable-line-chart',
      DotsScreen: 'dots',
      AdvancedChartScreen: 'advanced-chart',
      TestScreen: 'test',
    },
  },
};

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <NavigationContainer
      linking={linking}
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
  {
    name: 'TestScreen',
    component: Screens.TestScreen,
    options: {
      title: 'Dev screen',
    },
  },
  {
    name: 'DotsScreen',
    component: Screens.DotsScreen,
    options: {
      title: 'Dots',
    },
  },
  {
    name: 'AdvancedChartScreen',
    component: Screens.AdvancedChartScreen,
    options: {
      title: 'Advanced Charts',
    },
  },
];

const TOPBAR_DEFAULT_OPTIONS: DrawerNavigationOptions = {
  ...Platform.select<DrawerNavigationOptions>({
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
  }),
  headerLeft: ({ tintColor }) => <HamburgerButton tintColor={tintColor} />,
};

function RootNavigator() {
  const initRoute: ScreenName = __DEV__ ? 'Home' : 'Home';
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
