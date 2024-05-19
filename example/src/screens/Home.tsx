import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { Button } from '../components';
import type { DRNFC } from '../navigation/types';

function HomeScreen({ navigation }: DRNFC<'Home'>) {
  return (
    <View style={styles.container}>
      <Button label="Open menu" small onPress={() => navigation.openDrawer()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { HomeScreen };
