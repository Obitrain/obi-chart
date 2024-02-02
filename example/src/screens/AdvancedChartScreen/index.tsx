import Slider from '@react-native-community/slider';
import { Canvas, Group } from '@shopify/react-native-skia';
import {
  AxisLine,
  ScalablePath,
  useScalableGesture,
  type AnimatedDot,
} from 'obi-chart';
import React, { type FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { Button, Colors, ReText } from '../../components';
import { useDimensions } from '../../hooks';
import { Dot } from './Dot';
import { Tick } from './Tick';
import { useData } from './data';

export type Props = {};

const GRAPH_HEIGHT = 140;
// const PADDING_HORIZONTAL = 20;
const OFFSET_AXIS = GRAPH_HEIGHT + 50;

const AdvancedChartScreen: FC<Props> = function ({}) {
  const { width } = useDimensions();
  const [hideAxis, setHideAxis] = React.useState(false);
  const [hideDots, setHideDots] = React.useState(false);
  const [hideSettings, setHideSettings] = React.useState(false);

  const { data: graphs, dots, axisTicks } = useData(width, GRAPH_HEIGHT);

  const { scale, focalX, offsetX, pinchGesture, panGesture, reset } =
    useScalableGesture({
      width: width,
      startOffset: 0,
    });

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
  const path = useSharedValue(graphs[0]!.skiaPath);
  //   const path = useSharedValue(graphs[0]!.skiaPath);

  const gesture = Gesture.Simultaneous(
    //@ts-expect-error
    pinchGesture,
    panGesture
  );

  const scaleStr = useDerivedValue(() => {
    return scale.value.toFixed(2);
  }, [scale]);

  const offsetXStr = useDerivedValue(() => {
    return offsetX.value.toFixed(2);
  }, [offsetX]);

  return (
    <View style={styles.container}>
      <View style={styles.btnsContainer}>
        <Button
          label={hideAxis ? 'Show Axis' : 'Hide axis'}
          onPress={() => setHideAxis((old) => !old)}
        />
        <Button
          label={hideDots ? 'Show Dots' : 'Hide Dots'}
          onPress={() => setHideDots((old) => !old)}
        />
        <Button
          label={hideSettings ? 'Show Settings' : 'Hide Settings'}
          onPress={() => setHideSettings((old) => !old)}
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
        <Canvas style={[styles.canvas, { width, height: GRAPH_HEIGHT * 2 }]}>
          <ScalablePath
            {...{ focalX, offsetX, scale, path }}
            color={Colors.primary}
          />
          {!hideDots ? renderDots(dots, scale, focalX, offsetX) : null}
          {!hideAxis ? (
            <>
              <AxisLine
                {...{ width, focalX, scale, offsetX }}
                offsetY={OFFSET_AXIS}
              />
              {renderTicks(axisTicks, scale, focalX, offsetX)}
            </>
          ) : null}
        </Canvas>
      </GestureDetector>

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
  scale: Animated.SharedValue<number>,
  focalX: Animated.SharedValue<number>,
  offsetX: Animated.SharedValue<number>
) {
  return (
    <Group style="stroke" strokeWidth={4} color={Colors.primary}>
      {dots.map((dot, i) => (
        <Dot key={i} {...dot} {...{ scale, focalX, offsetX }} />
      ))}
    </Group>
  );
};

type AnimatedTick = {
  label: Animated.SharedValue<string>;
  x: Animated.SharedValue<number>;
};

export const renderTicks = function (
  ticks: AnimatedTick[],
  scale: Animated.SharedValue<number>,
  focalX: Animated.SharedValue<number>,
  offsetX: Animated.SharedValue<number>
) {
  //   <Group style="stroke" strokeWidth={4} color={Colors.primary}>
  return (
    <>
      {ticks.map((tick, i) => (
        <Tick
          key={i}
          initPosition={tick.x}
          label={tick.label}
          offsetY={OFFSET_AXIS + 10}
          {...{ scale, focalX, offsetX }}
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
    marginTop: 100,
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
