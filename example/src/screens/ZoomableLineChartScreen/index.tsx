import { ZoomableLineChart, type LineItem } from 'obi-chart';
import React, { type FC } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '../../components';
import { WEIGHT } from '../../data';
import { useDimensions } from '../../hooks';

export type Props = {};

const LINES: LineItem[] = [
  {
    color: Colors.primary,
    data: WEIGHT.map((x) => ({ x: x[0], y: x[1] })),
  },
];

const ZoomableLineChartScreen: FC<Props> = function ({}) {
  //   const [lineChartWidth, setLineChartWidth] = React.useState(0);
  const { width } = useDimensions();
  return (
    <ScrollView style={styles.container}>
      <View style={{ marginTop: 20, marginHorizontal: 20 }}>
        <ZoomableLineChart height={140} width={width - 40} line={LINES[0]!} />
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

export { ZoomableLineChartScreen };
