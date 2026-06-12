export type DateRange = 'day' | 'month' | 'trimester' | 'year' | 'all';

export const getMonthInterval = function (
  month: number,
  nbMonths: number
): string {
  if (month <= 0) throw new Error('Months should start at 1');
  return (month - ((month - 1) % nbMonths)).toString().padStart(2, '0');
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
    case 'all':
      return 'all';
  }
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
    else if (date < _range[0]) _range[0] = date;
    else if (date > _range[1]) _range[1] = date;
  }
  return ranges;
}

export function sampleDates(
  dates: Date[],
  sampleSize: number,
  indexOffset: number = 0
): { dates: Date[]; indexes: number[] } {
  if (sampleSize <= 0 || dates.length === 0) {
    return { dates: [], indexes: [] };
  }

  if (sampleSize >= dates.length) {
    return {
      dates,
      indexes: Array.from({ length: dates.length }, (_, i) => indexOffset + i),
    };
  }

  if (sampleSize === 1) {
    return { dates: [dates[0]!], indexes: [indexOffset] };
  }

  // Calculate total time span and interval
  const firstItem = dates[0]!;
  const lastItem = dates[dates.length - 1]!;
  const startTime = firstItem.getTime();
  const endTime = lastItem.getTime();
  const timeSpan = endTime - startTime;
  const timeInterval = timeSpan / (sampleSize - 1);

  const sampledDates: Date[] = [firstItem]; // Always include the first date
  const sampledIndexes = [0];
  let nextTime = startTime + timeInterval;

  // Select dates closest to each time interval
  for (let i = 1; i < sampleSize - 1; i++) {
    let closestDate = dates[0];
    let minDiff = Math.abs(startTime - nextTime);
    let closestIndex = 0;
    for (let j = 1; j < dates.length; j++) {
      const diff = Math.abs(dates[j]!.getTime() - nextTime);
      if (diff < minDiff) {
        closestDate = dates[j];
        closestIndex = j;
        minDiff = diff;
      }
    }
    sampledDates.push(closestDate!);
    sampledIndexes.push(closestIndex);
    nextTime += timeInterval;
  }

  sampledDates.push(lastItem); // Always include the last date
  sampledIndexes.push(dates.length - 1);

  return {
    dates: sampledDates,
    indexes: sampledIndexes.map((x) => indexOffset + x),
  };
}

export function sampleDatesByRange(
  dates: Date[],
  sampleSize: number,
  dateRange: DateRange
): Map<string, { dates: Date[]; indexes: number[] }> {
  const boundaries = getDateBoundaries(dates, dateRange);
  const rangedData = new Map<string, Date[]>();
  for (let i = 0; i < dates.length; i++) {
    let date = dates[i]!;
    for (const [key, [minDate, maxDate]] of boundaries) {
      if (date >= minDate && date <= maxDate) {
        if (!rangedData.has(key)) rangedData.set(key, []);
        rangedData.get(key)!.push(date);
        break;
      }
    }
  }
  const sampledData = new Map<string, { dates: Date[]; indexes: number[] }>();
  let offset = 0;
  for (const [key, value] of rangedData) {
    sampledData.set(key, sampleDates(value, sampleSize, offset));
    offset += value.length;
  }

  return sampledData;
}
