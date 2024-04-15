export type DateItem = [Date, number];
export type DateRange = 'day' | 'month' | 'trimester' | 'year' | 'all';

/**
 * Returns an array of dates that are evenly spaced between the first and last dates.
 * For example, given the dates:
 *  [2021-01-01, 2021-01-25, 2021-03-01, 2021-10-01]
 * and a sample size of 3, the function will return:
 * [2021-01-01, 2021-03-01, 2021-10-01]
 * @param dates
 * @param sampleSize
 * @returns
 */
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

export const getMonthInterval = function (
  month: number,
  nbMonths: number
): string {
  if (month <= 0) throw new Error('Months should start at 1');
  return (month - (month % nbMonths) + 1).toString().padStart(2, '0');
};

/**
 * Get the date interval based on the date range.
 * For example, for the date 2021-01-01:
 * - day: 2021-01-01
 * - month: 2021-01
 * - trimester: 2021-01
 * - year: 2021
 * @param date
 * @param dateRange
 * @returns
 */
export const getDateInterval = function (
  date: Date,
  dateRange: DateRange
): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate().toString().padStart(2, '0');

  const monthStr = month.toString().padStart(2, '0');

  switch (dateRange) {
    case 'day':
      return `${year}-${monthStr}-${day}`;
    case 'month':
      return `${year}-${monthStr}`;
    case 'trimester':
      return `${year}-${getMonthInterval(month, 3)}`;
    case 'year':
      return `${year}`;
  }
  throw new Error('Invalid date range');
};

//@ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fmtData = function (data: [Date, number][], dateRange: DateRange) {
  const _dataFmt = new Map<string, [number, number]>();
  for (const [date, value] of data) {
    const _dateStr = getDateInterval(date, dateRange);
    if (!_dataFmt.has(_dateStr))
      _dataFmt.set(_dateStr, [date.getTime(), value]);
  }

  return [..._dataFmt.values()];
};

/**
 * Groups an array of Date objects by a specific time interval (day, month, trimester, year)
 * and calculates the earliest and latest dates within each interval.
 * For instance, given the dates [2021-01-01, 2021-01-25, 2021-03-01, 2021-10-01]:
 *  - month: { '2021-01': [2021-01-01, 2021-01-25],
*              '2021-03': [2021-03-01, 2021-03-01],
               '2021-10': [2021-10-01, 2021-10-01] }

 * @param {Date[]} dates - An array of dates to group and find boundary dates for.
 * @returns {Map<string, [Date, Date]>} - A map where each key represents an interval
 * as a string (formatted according to the interval type, e.g., '2021', '2021-03', '2021-01-01'),
 * and each value is a tuple containing the earliest and latest dates within that interval.
 */
export function getDateBoundaries(dates: Date[], dateRange: DateRange) {
  const ranges = new Map<string, [Date, Date]>();

  for (const date of dates) {
    const _dateStr = getDateInterval(date, dateRange);
    const _range = ranges.get(_dateStr);
    if (!_range) ranges.set(_dateStr, [date, date]);
    else if (date > _range[1]) ranges.set(_dateStr, [_range[0], date]);
  }
  return ranges;
}
