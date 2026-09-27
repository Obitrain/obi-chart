# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

obi-chart is a React Native charting library built on `@shopify/react-native-skia`. It provides performant, gesture-enabled line charts with support for zooming, panning, and cursor interactions.

## Commands

```bash
# Install dependencies (uses Yarn workspaces)
yarn

# Run example app
yarn example start          # Start Metro bundler
yarn example android        # Run on Android
yarn example ios            # Run on iOS
yarn example web            # Run on Web

# Quality checks
yarn typecheck              # TypeScript checking
yarn lint                   # ESLint
yarn lint --fix             # Fix lint errors
yarn test                   # Run Jest tests
npx rnx-align-deps --write  # Align dependencies to RN version

# Build & Release
yarn prepare                # Build with react-native-builder-bob
yarn release                # Publish new version with release-it

# Expo SDK Upgrade (example app)
cd example
yarn add expo@^XX.0.0       # Replace XX with target SDK version (e.g., 53, 54)
npx expo install --fix      # Update all dependencies to match SDK version
```

## Architecture

### Core Components

- **LineChart** (`src/Charts/Linechart/`) - Static line chart rendering single or multiple paths
- **ZoomableLineChart** (`src/Charts/ZoomableLinechart/`) - Chart with pinch-to-zoom and pan gestures via `ScalablePath`
- **BottomAxis** (`src/Charts/BottomAxis/`) - Animated axis that syncs with zoom/pan gestures

### Key Utilities

- **buildGraph** (`src/Charts/graphUtils.ts`) - Converts raw `[number, number][]` data into `GraphData` with d3-scale mappings and Skia path
- **useScalableGesture** (`src/Charts/gesture.ts`) - Returns gesture handlers and shared values (scale, focalX, offsetX) for zoom/pan
- **useCursorGesture** (`src/Charts/gesture.ts`) - Gesture handlers for cursor/tooltip positioning
- **scaleCommands** (`src/Charts/graphUtils.ts`) - Worklet for transforming path commands during zoom animations

### Data Flow

1. Raw data `[x, y][]` → `buildGraph()` → `GraphData` (contains scaleX/scaleY from d3-scale, Skia path)
2. Gesture handlers update shared values (scale, focalX, offsetX)
3. `scaleCommands` worklet transforms path commands in real-time on UI thread
4. Charts re-render via Skia with transformed paths

### Dependencies

- **@shopify/react-native-skia** - Canvas and path rendering
- **d3-scale** / **d3-shape** - Data scaling and path generation
- **react-native-reanimated** - Shared values and worklets for animations
- **react-native-gesture-handler** - Touch gesture handling

## Code Style

Uses Prettier with: single quotes, 2-space tabs, ES5 trailing commas. Commits follow conventional commits (fix/feat/refactor/docs/test/chore).
