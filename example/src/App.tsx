import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import useCachedResources from './hooks/useCacheRessources';
import Navigation from './navigation';

export default function App() {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      //   <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Navigation colorScheme="light" />
        <StatusBar />
      </SafeAreaProvider>
      //   </GestureHandlerRootView>
    );
  }
}
