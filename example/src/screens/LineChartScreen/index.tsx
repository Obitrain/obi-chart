import { LineChart, type LineItem } from 'obi-chart';
import React, { type FC } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '../../components';
import { MONTHLY_DATA } from '../../data';
import { useDimensions } from '../../hooks';

export type Props = {};

const LINES: LineItem[] = [
  {
    color: Colors.primary,
    data: MONTHLY_DATA.map((x, i) => ({ x: i, y: x.value })),
  },
];

const LineChartScreen: FC<Props> = function ({}) {
  const { width } = useDimensions();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.chartContainer}>
        <LineChart height={140} width={width - 40} lines={LINES ?? []} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'red',
  },
  chartContainer: {
    backgroundColor: Colors.white,
    height: 150,
    // justifyContent: 'center',
    // alignItems: 'center',
    margin: 20,
    elevation: 2,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 5,
  },
  titleContainer: {
    marginLeft: 20,
  },
});

export { LineChartScreen };
