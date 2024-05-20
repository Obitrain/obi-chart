import type { DateRange } from '@obitrain/charts';
import { Utils } from '@obitrain/charts';
export type AxisItem = { ts: number; label: string };

export const getAxisTicks = function (
  dates: Date[],
  dateRange: DateRange
): AxisItem[] {
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  if (firstDate === undefined || lastDate === undefined)
    throw new Error('No date found');

  let data: AxisItem[] = [];
  const diff = lastDate.getFullYear() - firstDate.getFullYear();
  switch (dateRange) {
    case 'all':
      if (diff === 0)
        data = [
          {
            ts: firstDate.getTime(),
            label: firstDate.getFullYear().toString(),
          },
        ];
      else
        data = Array.from({ length: diff + 1 }).map((_, i) => {
          const year = firstDate.getFullYear() + i;
          return { ts: Date.UTC(year, 0, 1, 0, 0, 0), label: year.toString() };
        });
      break;
    case 'year':
      for (let i = 0; i < diff; i++) {
        let _yearlyData = Array.from({ length: 12 }).map((_, monthNumber) => {
          let ts = Date.UTC(
            firstDate.getFullYear() + i,
            monthNumber,
            1,
            0,
            0,
            0
          );
          return {
            ts,
            label: new Date(ts).toLocaleString(undefined, { month: 'narrow' }),
          };
        });
        data = data.concat(..._yearlyData);
      }
      break;
  }
  return data;
};

export type DataItem = [Date, number];

export const getEvenlySpacedData = function (
  data: DataItem[],
  sampleSize: number,
  dateRange: DateRange | undefined = undefined
): DataItem[] {
  const _dates = data.map((x) => x[0]);

  const _sampledDates =
    dateRange !== undefined
      ? Utils.sampleDatesByRange(_dates, sampleSize, dateRange)
      : new Map([['all', Utils.sampleDates(_dates, sampleSize)]]);

  const sampledData: DataItem[] = [];
  for (const { indexes } of _sampledDates.values()) {
    for (const i of indexes) {
      let _data = data[i];
      if (_data === undefined) throw new Error(`No data found at index ${i}`);
      sampledData.push(_data);
    }
  }
  return sampledData;
};
