# Obi-chart

React Native charts using react-native-skia

## Installation

The package is published to the GitLab package registry, so first point the `@obitrain` scope to it in your `.npmrc`:

```ini
@obitrain:registry=https://gitlab.com/api/v4/projects/10478649/packages/npm/
```

Or, if you use Yarn Berry, in your `.yarnrc.yml`:

```yaml
npmScopes:
  obitrain:
    npmRegistryServer: 'https://gitlab.com/api/v4/projects/10478649/packages/npm/'
```

Then install the library:

```sh
yarn add @obitrain/charts
```

### Peer dependencies

The library expects the following peer dependencies (see `package.json` for the exact ranges): `@shopify/react-native-skia` (>=2 <3), `d3-scale` (>=4 <5), `d3-shape` (>=3.2 <4), `react-native-gesture-handler` (^2.26), `react-native-reanimated` (^4) and `react-native-worklets` (>=0.5).

For Expo apps:

```sh
npx expo install @shopify/react-native-skia react-native-gesture-handler react-native-reanimated react-native-worklets
yarn add d3-scale d3-shape
```

## Animations



### 1. Bottom Axis

![Bottom Axis](./static/bottom-axis.gif)


## Usage

### Static line chart

`buildGraph` converts raw `[x, y][]` data into a `GraphData` object (Skia path, data points, d3 scales). `LineChart` renders one (`path`) or several (`paths`) paths on a Skia canvas:

```tsx
import { buildGraph, LineChart } from '@obitrain/charts';

const WIDTH = 300;
const HEIGHT = 140;

const data: [number, number][] = [
  [0, 10],
  [1, 25],
  [2, 18],
  [3, 40],
];

const graph = buildGraph(data, WIDTH, HEIGHT);

export function MyChart() {
  return (
    <LineChart
      path={graph.skiaPath}
      width={WIDTH}
      height={HEIGHT}
      color="dodgerblue"
    />
  );
}
```

### Zoomable line chart

`useScalableGesture` provides the `scale`, `focalX` and `offsetX` shared values plus the pinch/pan gestures to wire into a `GestureDetector`:

```tsx
import {
  buildGraph,
  useScalableGesture,
  ZoomableLineChart,
} from '@obitrain/charts';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

export function MyZoomableChart() {
  const graph = buildGraph(data, WIDTH, HEIGHT);
  const path = useSharedValue(graph.skiaPath);

  const { scale, focalX, offsetX, pinchGesture, panGesture } =
    useScalableGesture({ width: WIDTH });

  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  return (
    <GestureDetector gesture={gesture}>
      <ZoomableLineChart
        width={WIDTH}
        height={HEIGHT}
        {...{ path, scale, focalX, offsetX }}
      />
    </GestureDetector>
  );
}
```

### API overview

- `LineChart`: static line chart rendering one (`path`) or several (`paths`) Skia paths.
- `ZoomableLineChart`: line chart driven by `scale` / `focalX` / `offsetX` shared values for pinch-to-zoom and pan.
- `ScalablePath`: the zoomable path used by `ZoomableLineChart`, usable in your own `Canvas`.
- `BottomAxis` / `AxisLine` / `Tick`: animated bottom axis that stays in sync with zoom/pan gestures.
- `Cursor`: circle that follows the path at a given x position (tooltip cursor).
- `useScalableGesture`: returns pinch/pan gestures, the `scale` / `focalX` / `offsetX` shared values and a `reset()` helper.
- `useCursorGesture`: pan/tap gestures returning the cursor `xPosition` / `yPosition`, optionally snapping to data points.
- `useUpdateAxis`: reacts to scale thresholds, e.g. to switch dataset granularity while zooming.
- `useDotsTransition`: animates dots between graphs while keeping them glued to the path.
- `buildGraph`: converts `[x, y][]` data into `GraphData` (`skiaPath`, `dataPoints`, d3 `scaleX` / `scaleY`, ...).
- `getYForX` / `scaleCommands`: worklet helpers to compute y on a path and transform path commands during animations.
- Date sampling utilities: `sampleDates`, `sampleDatesByRange`, `getDateBoundaries`, `getDateInterval`.

See the [example](example) app for full demos (cursor, dots, axis, advanced charts).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
