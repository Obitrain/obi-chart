import { it } from '@jest/globals';
import * as U from '../dateUtils';

it.each([
  {
    input: [
      [new Date('2021-01-01'), 1],
      [new Date('2021-01-25'), 1],
      [new Date('2021-03-01'), 1],
      [new Date('2021-10-01'), 1],
      [new Date('2021-12-01'), 1],
    ] as U.DateItem[],
    sampleSize: 3,
    output: ['2021-01-01', '2021-10-01', '2021-12-01'],
  },
])('getEvenlySpacedData works', ({ input, sampleSize, output }) => {
  const _output = U.getEvenlySpacedData(input, sampleSize).map(
    (x) => x[0].toISOString().split('T')[0]
  );
  expect(output).toEqual(_output);
});

it.each([
  { month: 1, nbMonths: 3, output: '01' },
  { month: 2, nbMonths: 2, output: '03' },
])(`getMonthInterval works`, ({ month, nbMonths, output }) => {
  const _output = U.getMonthInterval(month, nbMonths);
  expect(_output).toEqual(output);
});

it.each([
  {
    input: new Date('2021-01-01'),
    dateRange: 'year' as U.DateRange,
    output: '2021',
  },
  {
    input: new Date('2021-01'),
    dateRange: 'trimester' as U.DateRange,
    output: '2021-01',
  },
  {
    input: new Date('2021-01-01'),
    dateRange: 'month' as U.DateRange,
    output: '2021-01',
  },
  {
    input: new Date('2021-01-01'),
    dateRange: 'day' as U.DateRange,
    output: '2021-01-01',
  },
])(
  'getDateInterval works with dateRange $dateRange',
  ({ input, dateRange, output }) => {
    const _output = U.getDateInterval(input, dateRange);
    expect(_output).toEqual(output);
  }
);

it.each([
  {
    input: [
      new Date('2021-01-01'),
      new Date('2021-01-25'),
      new Date('2022-03-01'),
      new Date('2022-10-01'),
      new Date('2022-12-01'),
    ],
    dateRange: 'year' as U.DateRange,
    output: new Map([
      ['2021', [new Date('2021-01-01'), new Date('2021-01-25')]],
      ['2022', [new Date('2022-03-01'), new Date('2022-12-01')]],
    ]),
  },
])('getDateBoundaries works', ({ input, dateRange, output }) => {
  const _output = U.getDateBoundaries(input, dateRange);
  expect(_output).toEqual(output);
});
