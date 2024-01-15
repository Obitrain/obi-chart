import { BottomAxis, useAxisGesture, useUpdateAxis } from 'obi-chart';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Button } from '../components';

const DATA_RANGES = [
  Array.from({ length: 5 }, (_, i) => i),
  Array.from({ length: 10 }, (_, i) => i),
  Array.from({ length: 20 }, (_, i) => i),
];

const RANGE_SCALES: number[] = [
  // Will show data range 0 for scale < 1.6,
  //                range 1 for 1.6 >= scale < 2.5,
  //                range 2 for 2.5 >= scale < 99
  1.6, 2.5, 99,
];

const AXIS_LENGTH = 400;

export function BottomAxisScreen() {
  const [currentRange, setCurrentRange] = useState(0);

  const {
    scale,
    focalX,
    pinchGesture,
    panGesture,
    offsetX,
    reset,
    tickInterval,
  } = useAxisGesture({
    startOffset: 20,
    axisWidth: AXIS_LENGTH,
    nbTicks: DATA_RANGES[currentRange]!.length,
  });

  const _updateRange = useCallback((newValue?: number) => {
    setCurrentRange((old) => {
      const _newValue =
        newValue ?? (old + 1 > DATA_RANGES.length - 1 ? 0 : old + 1);
      return _newValue;
    });
  }, []);

  const { currentIndex: currentRangeShared } = useUpdateAxis({
    scale,
    scales: RANGE_SCALES,
    onScaleChange: (_newIndex) => _updateRange(_newIndex),
  });

  const resetChart = () => {
    reset();
    setCurrentRange(0);
    currentRangeShared.value = 0;
  };

  //@ts-expect-error
  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  return (
    <View style={styles.container}>
      <View style={styles.btnsContainer}>
        <Button label="Reset Chart" small onPress={resetChart} />
        <Button
          label={`Change Axis (${currentRange})`}
          small
          onPress={() => _updateRange()}
        />
        <Button
          label={`Set zoom (${2})`}
          small
          onPress={() => (scale.value = scale.value === 1 ? 2 : 1)}
        />
        <Button
          label={`Set focal (200)`}
          small
          onPress={() => (focalX.value = focalX.value === 0 ? 200 : 0)}
        />
      </View>
      <GestureDetector gesture={gesture}>
        <View style={styles.container}>
          <BottomAxis
            {...{
              data: DATA_RANGES[currentRange]!,
              scale,
              focalX,
              offsetX,
              tickInterval,
            }}
            style={styles.axis}
            yPosition={250}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  axis: {
    height: 500,
  },
  btnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 20,
    flexWrap: 'wrap',
  },
});
