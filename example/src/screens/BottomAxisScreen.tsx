import { BottomAxis, useAxisGesture } from 'obi-chart';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Button } from '../components';

const DATA_RANGES = [
  Array.from({ length: 5 }, (_, i) => i),
  Array.from({ length: 5 }, (_, i) => 100 + i * 90),
  Array.from({ length: 5 }, (_, i) => (100 + i * 90) / 100),
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

  const resetChart = () => {
    reset();
    setCurrentRange(0);
  };

  //@ts-expect-error
  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  //   console.log(DATA_RANGES[currentRange]);

  const _updateRange = useCallback((newValue?: number) => {
    setCurrentRange((old) => {
      const _newValue =
        newValue ?? (old + 1 > DATA_RANGES.length - 1 ? 0 : old + 1);
      console.log('new value: ', _newValue);
      return _newValue;
    });
  }, []);

  //   useAnimatedReaction(
  //     () => scale.value,
  //     (currentVal, prevVal) => {
  //       const _prevVal = prevVal ?? 0;
  //       console.log(currentVal, _prevVal, scale.value);
  //       if (
  //         currentVal > 1.5 &&
  //         _prevVal < 1.5 &&
  //         scale.value === currentVal &&
  //         currentVal > _prevVal
  //       ) {
  //         console.log('\n ENTER ====== \n');
  //         // runOnJS(_updateRange)(1);
  //         lastScale.value = 1;
  //         scale.value = 1;
  //       }
  //     },
  //     []
  //   );

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
        <View style={{ flex: 1 }}>
          <BottomAxis
            {...{
              data: DATA_RANGES[currentRange]!,
              scale,
              focalX,
              offsetX,
              tickInterval,
            }}
            style={{ height: 500 }}
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
  btnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'red',
    flexWrap: 'wrap',
  },
});
