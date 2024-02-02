export type DateItem = [Date, number];
export type DateRange = 'day' | 'month' | 'trimester' | 'year' | 'all';

export function getEvenlySpacedData(
  dates: DateItem[],
  sampleSize: number
): DateItem[] {
  if (sampleSize <= 0 || dates.length === 0) {
    return [];
  }

  if (sampleSize >= dates.length) {
    return dates;
  }

  // Calculate total time span and interval
  const firstItem = dates[0]!;
  const lastItem = dates[dates.length - 1]!;
  const startTime = firstItem[0].getTime();
  const endTime = lastItem[0].getTime();
  const timeSpan = endTime - startTime;
  const timeInterval = timeSpan / (sampleSize - 1);

  const sampledDates: DateItem[] = [firstItem]; // Always include the first date
  let nextTime = startTime + timeInterval;

  // Select dates closest to each time interval
  for (let i = 1; i < sampleSize - 1; i++) {
    let closestDate = dates[0];
    let minDiff = Math.abs(firstItem[0].getTime() - nextTime);

    for (let j = 1; j < dates.length; j++) {
      const diff = Math.abs(dates[j]![0].getTime() - nextTime);
      if (diff < minDiff) {
        closestDate = dates[j];
        minDiff = diff;
      }
    }
    sampledDates.push(closestDate!);
    nextTime += timeInterval;
  }

  sampledDates.push(lastItem); // Always include the last date

  return sampledDates;
}

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
  switch (dateRange) {
    case 'all':
      const diff = lastDate.getFullYear() - firstDate.getFullYear();
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
    //   case 'year':
    //     data = Array.from({ length: 12}).map((_, i) => {
    //         const month = i + 1;
    //         return { ts: Date.UTC(firstDate.getFullYear(), month, 1, 0, 0, 0), label: month.toString() };
    //         }
  }

  return data;
};

const getMonthInterval = function (month: number, nbMonths: number): string {
  return (month - (month % nbMonths) + 1).toString().padStart(2, '0');
};

const getDateInterval = function (date: Date, dateRange: DateRange): string {
  const year = date.getFullYear();
  let month = date.getMonth();
  const day = date.getDate();

  switch (dateRange) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'month':
      return `${year}-${month}`;
    case 'trimester':
      return `${year}-${getMonthInterval(month, 3)}`;
    case 'year':
      return `${year}`;
  }
  throw new Error('Invalid date range');
};

const fmtData = function (data: [Date, number][], dateRange: DateRange) {
  const _dataFmt = new Map<string, [number, number]>();
  for (const [date, value] of data) {
    const _dateStr = getDateInterval(date, dateRange);
    if (!_dataFmt.has(_dateStr))
      _dataFmt.set(_dateStr, [date.getTime(), value]);
  }

  return [..._dataFmt.values()];
};

export function getDateBoundaries(dates: Date[]) {
  const ranges = new Map<string, [Date, Date]>();

  for (const date of dates) {
    const _dateStr = getDateInterval(date, 'year');
    const _range = ranges.get(_dateStr);
    if (!_range) ranges.set(_dateStr, [date, date]);
    else if (date > _range[1]) ranges.set(_dateStr, [_range[0], date]);
  }
  return ranges;
}
