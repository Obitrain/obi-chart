/** Data bucketing per zoom band. */
export type DataGranularity = 'year' | 'month' | 'week' | 'day';
/** Axis label style per zoom band. */
export type TickGranularity = 'year' | 'month' | 'monthLong' | 'week';

export type TickItem = { ts: number; label: string };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const monthLabel = (d: Date, style: 'narrow' | 'long') =>
  capitalize(d.toLocaleDateString(undefined, { month: style }));

/**
 * Generate axis ticks between `ts0` and `ts1` for the given granularity:
 * - year: January 1st of each year, labelled with the year
 * - month: 1st of each month, labelled with the month initial (year on January)
 * - monthLong: 1st of each month, labelled with the full month name
 * - week: every Monday, labelled with the short weekday and the day of month
 */
export const getTicksForWindow = function (
  ts0: number,
  ts1: number,
  granularity: TickGranularity
): TickItem[] {
  const ticks: TickItem[] = [];
  const start = new Date(ts0);
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  switch (granularity) {
    case 'year':
      d.setMonth(0, 1);
      if (d.getTime() < ts0) d.setFullYear(d.getFullYear() + 1);
      while (d.getTime() <= ts1) {
        ticks.push({ ts: d.getTime(), label: String(d.getFullYear()) });
        d.setFullYear(d.getFullYear() + 1);
      }
      break;
    case 'month':
    case 'monthLong':
      d.setDate(1);
      if (d.getTime() < ts0) d.setMonth(d.getMonth() + 1);
      while (d.getTime() <= ts1) {
        ticks.push({
          ts: d.getTime(),
          label:
            granularity === 'month' && d.getMonth() === 0
              ? String(d.getFullYear())
              : monthLabel(d, granularity === 'month' ? 'narrow' : 'long'),
        });
        d.setMonth(d.getMonth() + 1);
      }
      break;
    case 'week':
      while (d.getDay() !== 1 || d.getTime() < ts0) d.setDate(d.getDate() + 1);
      while (d.getTime() <= ts1) {
        const weekday = capitalize(
          d.toLocaleDateString(undefined, { weekday: 'short' })
        );
        ticks.push({ ts: d.getTime(), label: `${weekday} ${d.getDate()}` });
        d.setDate(d.getDate() + 7);
      }
      break;
  }
  return ticks;
};

/** Withings-style range title: "22 Dec 2025 – 1 Jul", years only when they differ. */
export const formatRange = function (
  ts0: number,
  ts1: number,
  granularity: DataGranularity
): string {
  const d0 = new Date(ts0);
  const d1 = new Date(ts1);
  if (granularity === 'year') return `${d0.getFullYear()} – ${d1.getFullYear()}`;
  const sameYear = d0.getFullYear() === d1.getFullYear();
  const short: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const first = d0.toLocaleDateString(
    undefined,
    sameYear ? short : { ...short, year: 'numeric' }
  );
  return `${first} – ${d1.toLocaleDateString(undefined, short)}`;
};
