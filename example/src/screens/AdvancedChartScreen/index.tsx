import {
  AxisLine,
  ScalablePath,
  useScalableGesture,
  type AnimatedDot,
} from '@obitrain/charts';
import Slider from '@react-native-community/slider';
import { Canvas, Group, matchFont } from '@shopify/react-native-skia';
import React, { useCallback, useRef, type FC } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Button, Colors, ReText } from '../../components';
import { useDimensions } from '../../hooks';
import { Dot } from './Dot';
import { Tick } from './Tick';
import { YAxis } from './YAxis';
import { useData, type AnimatedTick } from './data';

export type Props = {};

const GRAPH_HEIGHT = 140;
const CANVAS_HEIGHT = GRAPH_HEIGHT * 2;
// const PADDING_HORIZONTAL = 20;
const OFFSET_AXIS = GRAPH_HEIGHT + 50;

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });

const font = matchFont({ fontFamily, fontSize: 14 });

const AdvancedChartScreen: FC<Props> = function ({}) {
  const { width } = useDimensions();
  const [hideAxis, setHideAxis] = React.useState(false);
  const [hideDots, setHideDots] = React.useState(false);
  const [hideSettings, setHideSettings] = React.useState(false);
  const [hideYAxis, setHideYAxis] = React.useState(false);
  const [currentChart, setCurrentChart] = React.useState(0);

  const graphWidth = width - 40;

  const { graphs, dots, axesX, yDomains } = useData(graphWidth, GRAPH_HEIGHT);

  const { scale, focalX, offsetX, pinchGesture, panGesture, reset } =
    useScalableGesture({
      width: graphWidth,
      startOffset: 0,
    });

  //   console.log(dots[0]!.y.value, 'dots[0]!.y.value');

  const resetChart = () => {
    reset();
  };

  //   const progress = useSharedValue(0);
  //   const path = usePathInterpolation(
  //     progress,
  //     [0, 1, 2],
  //     [
  //       graphs[0]!.skiaPath,
  //       //graphs[1]!.skiaPath, graphs[2]!.skiaPath
  //     ]
  //   );
  const path = useSharedValue(graphs[currentChart]!.skiaPath);
  const yDomain = useRef(yDomains[currentChart]!);
  const axisTicks = useRef(axesX[currentChart]!);

  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const scaleStr = useDerivedValue(() => {
    return scale.value.toFixed(2);
  }, [scale]);

  const offsetXStr = useDerivedValue(() => {
    return offsetX.value.toFixed(2);
  }, [offsetX]);

  const _changeChart = useCallback(
    (newChartIdx) => {
      const newGraph = graphs[newChartIdx]!;
      path.value = newGraph.skiaPath;
      yDomain.current = yDomains[newChartIdx]!;
      axisTicks.current = axesX[newChartIdx]!;
      console.log(axisTicks.current.length / 12);

      scale.value =
        // all
        newChartIdx === 0
          ? 1
          : // yearly
            axisTicks.current.length / 12;

      dots.map((dot, i) => {
        dot.x.value = newGraph.dataPoints[i]?.x ?? 0;
        dot.y.value = newGraph.dataPoints[i]?.y ?? 0;
        dot.opacity.value = newGraph.dataPoints[i] !== undefined ? 1 : 0;
      });
    },
    [axesX, dots, graphs, path, scale, yDomains]
  );

  return (
    <View style={styles.container}>
      <View style={styles.btnsContainer}>
        <Button
          label={hideAxis ? 'Show Axis' : 'Hide axis'}
          onPress={() => setHideAxis((old) => !old)}
        />
        <Button
          label={hideYAxis ? 'Show Y Axis' : 'Hide Y axis'}
          onPress={() => setHideYAxis((old) => !old)}
        />
        <Button
          label={hideDots ? 'Show Dots' : 'Hide Dots'}
          onPress={() => setHideDots((old) => !old)}
        />
        <Button
          label={hideSettings ? 'Show Settings' : 'Hide Settings'}
          onPress={() => setHideSettings((old) => !old)}
        />
        <Button
          label={'Change chart'}
          onPress={() => {
            setCurrentChart((old) => {
              const _newChartIdx = (old + 1) % graphs.length;
              _changeChart(_newChartIdx);
              return _newChartIdx;
            });
          }}
        />
        <Button label="Reset Chart" small onPress={resetChart} />
      </View>
      {false && (
        <View style={styles.periodBtns}>
          <Button small label="Week" />
          <Button small label="Month" />
          <Button small label="Trimester" />
          <Button small label="Year" />
          <Button small label="All" />
        </View>
      )}
      <GestureDetector gesture={gesture}>
        <Canvas style={[styles.canvas, { width, height: CANVAS_HEIGHT }]}>
          <Group
            transform={[{ translateY: (CANVAS_HEIGHT - OFFSET_AXIS) / 2 }]}
          >
            {false && (
              <ScalablePath
                {...{ focalX, offsetX, scale, path }}
                color={Colors.primary}
              />
            )}
            {!hideDots ? renderDots(dots, scale, focalX, offsetX) : null}
            {!hideAxis ? (
              <>
                <AxisLine
                  {...{ focalX, scale, offsetX }}
                  width={graphWidth}
                  offsetY={OFFSET_AXIS}
                />
                {renderTicks(
                  axisTicks.current,
                  scale,
                  focalX,
                  offsetX,
                  graphWidth
                )}
              </>
            ) : null}
            {!hideYAxis ? (
              <YAxis
                minY={yDomain.current[0]!}
                maxY={yDomain.current[1]!}
                height={OFFSET_AXIS}
                width={width}
                font={font}
              />
            ) : null}
          </Group>
        </Canvas>
      </GestureDetector>

      {/* Settings */}

      {!hideSettings ? (
        <>
          <View style={styles.sliderContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.value}>Scale: </Text>
              <ReText style={styles.value} text={scaleStr} />
            </View>
            <Slider
              style={{ width: width / 1.5 }}
              minimumValue={1}
              maximumValue={10}
              step={0.2}
              value={scale.value}
              onValueChange={(value) => {
                scale.value = value;
              }}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
            />
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.value}>OffsetX: </Text>
              <ReText style={styles.value} text={offsetXStr} />
            </View>
            <Slider
              style={{ width: width / 1.5 }}
              minimumValue={0}
              maximumValue={width}
              step={10}
              value={offsetX.value}
              onValueChange={(value) => {
                offsetX.value = value;
              }}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
            />
          </View>
        </>
      ) : null}
    </View>
  );
};

export const renderDots = function (
  dots: AnimatedDot[],
  scale: SharedValue<number>,
  focalX: SharedValue<number>,
  offsetX: SharedValue<number>
) {
  return (
    <Group style="stroke" strokeWidth={4} color={Colors.primary}>
      {dots.map((dot, i) => (
        <Dot key={i} {...dot} {...{ scale, focalX, offsetX }} />
      ))}
    </Group>
  );
};

export const renderTicks = function (
  ticks: AnimatedTick[],
  scale: SharedValue<number>,
  focalX: SharedValue<number>,
  offsetX: SharedValue<number>,
  maxWidth?: number
) {
  //   <Group style="stroke" strokeWidth={4} color={Colors.primary}>

  return (
    <>
      {ticks.map((tick, i) => (
        <Tick
          key={i}
          initPosition={tick.x}
          label={tick.label}
          font={font}
          offsetY={OFFSET_AXIS + 10}
          {...{ scale, focalX, offsetX, maxWidth }}
        />
      ))}
    </>
  );
  //   </Group>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    backgroundColor: 'white',
    marginTop: 30,
  },
  btnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    marginVertical: 20,
  },
  periodBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  value: {},
  textContainer: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    height: 60,
    marginLeft: 20,
  },
});

export { AdvancedChartScreen };
