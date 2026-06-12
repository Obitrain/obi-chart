# Body Composition chart (Withings-style)

The `BodyCompositionScreen` example ([example/src/screens/BodyCompositionScreen](../example/src/screens/BodyCompositionScreen)) reproduces the Withings body-composition chart: two series with hollow dot markers on a dark theme, a percentage grid, and a pinch-to-zoom interaction where the time axis adapts its granularity (years → months → weeks → days) to the visible window.

![Body composition chart](../static/body-composition.png)

It is built entirely from library primitives; this document explains how the pieces fit together and the design decisions behind the gesture and rendering layers.

## Architecture

Raw data is sampled at several densities (one per zoom band) and turned into Skia paths by `buildGraph`. Gestures only write three shared values — `scale`, `focalX`, `offsetX` — and everything drawn on the canvas derives its position from them on the UI thread, frame by frame. React state is only involved when the zoom band or the visible window changes.

```mermaid
flowchart LR
    subgraph Data ["Build time (per band)"]
        D["[ts, value][]"] --> S["sampleEvenly<br/>14 / 40 / 90 / 120 pts"]
        S --> G["buildGraph<br/>(shared x/y domain)"]
    end

    subgraph Gestures ["UI thread (every frame)"]
        P["Pan (1 finger)"] --> SV["scale / focalX / offsetX<br/>(shared values)"]
        Z["Pinch (2 fingers)"] --> SV
        SV --> T["getPositionWl"]
        T --> SP["ScalablePath ×2"]
        T --> DT["Dots ×2 (one path/series)"]
        T --> TK["Tick / AxisLine"]
    end

    subgraph React ["JS thread (on band / window change)"]
        SV -.->|useUpdateAxis| B["band index"]
        B --> SW["swap band paths<br/>+ useDotsTransition"]
        SV -.->|"quantized reaction"| W["visible window"]
        W --> TS["tick slice + title + deltas<br/>(setState)"]
    end

    G --> SP
    SW --> SP
    TS --> TK
```

### The screen-space transform

Every x position goes through one worklet ([`getPositionWl`](../src/Charts/gesture.ts)):

```
x' = (x - focalX) · scale + focalX + offsetX
```

`focalX` is the screen pivot of the zoom, `offsetX` the pan translation. `ScalablePath` applies the equivalent affine matrix to whole paths; `Dots` and `Tick` apply it per element.

## Gestures

### Pan: live clamping, no snap-back

The pan accumulates incremental deltas (`event.changeX`) and clamps the offset **during the drag** against the bounds that keep the content edges pinned to the viewport ([`getOffsetBoundsWl`](../src/Charts/gesture.ts)):

```
maxOffset = startOffset + focalX · (scale - 1)        // left data edge at the left border
minOffset = startOffset + (1 - scale) · (width - focalX)  // right data edge at the right border
```

At `scale = 1` the interval collapses to a single point, so panning an unzoomed chart is simply inert. This replaces the previous design (free overscroll + animated snap-back in `onEnd`), which produced two artifacts measured on device: a full-width rubber-band on every unzoomed pan, and an instantaneous teleport when re-grabbing during the 300 ms snap animation (the next pan's base was already committed to the animation target).

### Pinch: the glued-fingers invariant

The defining property of a correct two-finger zoom is that **the content under each finger stays under that finger** — this is what makes the chart "zoom on what you focus". Scaling around a fixed focal is not enough: a natural pinch is asymmetric, so the focal (the fingers' centroid) moves while zooming, and when `offsetX ≠ 0` even a pure scale change shifts the content under the focal.

The discrete update that satisfies the invariant between two events `(f₁, s₁) → (f₂, s₂)` is:

```
offsetX₂ = (f₂ - f₁ + offsetX₁ / s₁) · s₂
```

with one exception: on the **first** event of a gesture (and when recovering from a one-finger tail), the focal jump is a re-anchoring, not finger movement, so the offset is instead rebased to keep all content stationary:

```mermaid
stateDiagram-v2
    [*] --> Pivot: onStart / pointer count < 2
    Pivot --> Follow: first 2-finger event<br/>re-anchor, content does not move
    Follow --> Follow: offset follows Δfocal,<br/>rescales with the zoom
    Follow --> Pivot: finger lifted (tail)
    Follow --> [*]: onEnd
```

Both branches end with the same bounds clamp as the pan, so zooming out at a data edge keeps the edge pinned. The invariant is locked by a step-by-step simulation test in [gesture.test.ts](../src/__tests__/gesture.test.ts) (`pinch focal math`) asserting both finger anchor points track exactly through a 20-step asymmetric pinch.

The pan is restricted to `maxPointers(1)`: two fingers belong to the pinch, whose follow-rebase already provides two-finger panning. Letting both handlers write `offsetX` (the previous `Gesture.Simultaneous` behaviour) made the pan's absolute writes discard the pinch rebase.

## Adaptive axis (zoom bands)

Band thresholds are expressed in *visible window duration*, converted to scale values once (`BAND_SCALES` in [data.ts](../example/src/screens/BodyCompositionScreen/data.ts)):

| Band | Visible window | Axis ticks | Sample size |
| --- | --- | --- | --- |
| years | > 2 years | Jan 1st, year label | 14 pts |
| months | 3 months – 2 years | 1st of month, narrow month (year on Jan) | 40 pts |
| weeks | 3 weeks – 3 months | Mondays, day of month | 90 pts |
| days | < 3 weeks | every day, day of month | 120 pts |

`useUpdateAxis` watches `scale` on the UI thread and fires once per band crossing; the screen swaps the band's pre-built paths into the rendered shared values and `useDotsTransition` animates the dot set to the new sampling.

### Windowed ticks

Tick labels for all four granularities are **precomputed once** at mount (Date/Intl formatting mid-gesture cost 10–50 ms per regeneration on the JS thread). While panning:

- years/months render their full set with a stable array identity — no re-render at all;
- weeks/days are sliced to the visible window ± one window of buffer, refreshed by a UI-thread reaction quantized to half-window crossings (so panning fires a `setState` at most twice per window traversed).

## Performance notes

Skia works in retained mode: re-rendering React components is the expensive path, while animating values through worklets is nearly free. The screen therefore keeps everything gesture-driven on the UI thread and minimizes what React re-renders:

- **`Dots` over per-dot components.** 240 `Dot` components each run a worklet and update ~2 Skia nodes per frame; on a OnePlus Nord this held zoomed pans at an 18 ms median frame (74% janky on the 90 Hz panel). [`Dots`](../src/Charts/Dots.tsx) rebuilds one `SkPath` per series in a single worklet (with off-screen culling), bringing the median to 5 ms (2.3% janky). The trade-off: per-dot opacity is binary (the 200 ms fade of individual dots becomes a snap).
- **Stable gesture instances.** `useScalableGesture` memoizes its `Pan`/`Pinch` objects: handing new instances to `GestureDetector` mid-gesture resets the active pan.
- **Stable reactions.** `useDotsTransition` and `useUpdateAxis` take explicit dependencies (and a ref-based dispatcher for the latter), so mid-pan re-renders don't tear down and re-fire UI-thread reactions.

## Library additions

| Export | Purpose |
| --- | --- |
| `Dots` | A whole dot series as one Skia path (two with `fillColor` for the hollow-ring look) |
| `Dot` | Single marker, zoom-aware, true per-dot opacity animation |
| `YAxis` | Horizontal gridlines with right-side labels (`values`/`nbTicks`, `formatLabel`) |
| `getOffsetBoundsWl` | The pan/pinch offset bounds worklet |
| `Tick` | Now themeable; a negative `tickLength` draws a full-height vertical gridline |
