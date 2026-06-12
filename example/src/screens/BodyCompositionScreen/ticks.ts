export type Granularity = 'year' | 'month' | 'week' | 'day';

export type TickItem = { ts: number; label: string };

const narrowMonth = (d: Date) =>
  d.toLocaleString(undefined, { month: 'narrow' });

/**
 * Generate axis ticks between `ts0` and `ts1` for the given granularity:
 * - year: January 1st of each year, labelled with the year
 * - month: 1st of each month, labelled with the month initial (year on January)
 * - week: every Monday, labelled with the day of month
 * - day: every day, labelled with the day of month (month initial on the 1st)
 */
export const getTicksForWindow = function (
  ts0: number,
  ts1: number,
  granularity: Granularity
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
      d.setDate(1);
      if (d.getTime() < ts0) d.setMonth(d.getMonth() + 1);
      while (d.getTime() <= ts1) {
        ticks.push({
          ts: d.getTime(),
          label: d.getMonth() === 0 ? String(d.getFullYear()) : narrowMonth(d),
        });
        d.setMonth(d.getMonth() + 1);
      }
      break;
    case 'week':
      while (d.getDay() !== 1 || d.getTime() < ts0) d.setDate(d.getDate() + 1);
      while (d.getTime() <= ts1) {
        ticks.push({ ts: d.getTime(), label: String(d.getDate()) });
        d.setDate(d.getDate() + 7);
      }
      break;
    case 'day':
      if (d.getTime() < ts0) d.setDate(d.getDate() + 1);
      while (d.getTime() <= ts1) {
        ticks.push({
          ts: d.getTime(),
          label: d.getDate() === 1 ? narrowMonth(d) : String(d.getDate()),
        });
        d.setDate(d.getDate() + 1);
      }
      break;
  }
  return ticks;
};

export const formatRange = function (
  ts0: number,
  ts1: number,
  granularity: Granularity
): string {
  const d0 = new Date(ts0);
  const d1 = new Date(ts1);
  if (granularity === 'year') return `${d0.getFullYear()} – ${d1.getFullYear()}`;
  const opts: Intl.DateTimeFormatOptions =
    granularity === 'month'
      ? { month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
  return `${d0.toLocaleDateString(undefined, opts)} – ${d1.toLocaleDateString(
    undefined,
    opts
  )}`;
};
