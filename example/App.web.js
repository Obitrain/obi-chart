import 'react-native-gesture-handler';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import React from 'react';

// CanvasKit must be loaded before any module calls into Skia (e.g. matchFont)
export default function App() {
  return (
    <WithSkiaWeb
      getComponent={() => import('./src/App')}
      opts={{
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.40.0/bin/full/${file}`,
      }}
    />
  );
}
