import { it } from '@jest/globals';
import * as U from '../dateUtils';

it.each([
  { month: 1, nbMonths: 3, output: '01' },
  { month: 3, nbMonths: 3, output: '01' },
  { month: 4, nbMonths: 3, output: '04' },
  { month: 12, nbMonths: 3, output: '10' },
  { month: 2, nbMonths: 2, output: '01' },
  { month: 3, nbMonths: 2, output: '03' },
])(
  'getMonthInterval works with month $month and nbMonths $nbMonths',
  ({ month, nbMonths, output }) => {
    const _output = U.getMonthInterval(month, nbMonths);
    expect(_output).toEqual(output);
  }
);

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
  {
    input: new Date('2021-01-01'),
    dateRange: 'all' as U.DateRange,
    output: 'all',
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
    name: 'sorted dates',
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
  {
    name: 'unsorted dates',
    input: [
      new Date('2021-01-25'),
      new Date('2021-01-01'),
      new Date('2021-01-10'),
      new Date('2022-12-01'),
      new Date('2022-03-01'),
    ],
    dateRange: 'year' as U.DateRange,
    output: new Map([
      ['2021', [new Date('2021-01-01'), new Date('2021-01-25')]],
      ['2022', [new Date('2022-03-01'), new Date('2022-12-01')]],
    ]),
  },
])('getDateBoundaries works with $name', ({ input, dateRange, output }) => {
  const _output = U.getDateBoundaries(input, dateRange);
  expect(_output).toEqual(output);
});

it.each([
  {
    input: [
      '2021-01-01',
      '2021-01-25',
      '2022-03-01',
      '2022-10-01',
      '2022-12-01',
    ],
    sampleSize: 3,
    output: {
      dates: ['2021-01-01', '2022-03-01', '2022-12-01'],
      indexes: [0, 2, 4],
    },
  },
  {
    input: [
      '2021-01-01',
      '2021-01-25',
      '2022-03-01',
      '2022-10-01',
      '2022-12-01',
    ],
    sampleSize: 1,
    output: {
      dates: ['2021-01-01'],
      indexes: [0],
    },
  },
])(
  'sampleDates with sampleSize $sampleSize',
  ({ input, sampleSize, output }) => {
    const _input = input.map((x) => new Date(x));
    const _output = U.sampleDates(_input, sampleSize);
    const _outputDates = _output.dates.map(
      (x) => x.toISOString().split('T')[0]
    );
    expect({
      ..._output,
      dates: _outputDates,
    }).toEqual(output);
  }
);
it.each([
  {
    input: [
      // 2021
      '2021-01-01',
      '2021-01-25',
      '2021-07-01',
      '2021-10-01',
      // 2022
      '2022-03-01',
      '2022-10-01',
      '2022-12-01',
      // 2023
      '2023-04-01',
    ],
    sampleSize: 3,
    dateRange: 'year' as U.DateRange,
    output: new Map([
      [
        '2021',
        {
          dates: ['2021-01-01', '2021-07-01', '2021-10-01'],
          indexes: [0, 2, 3],
        },
      ],
      [
        '2022',
        {
          dates: ['2022-03-01', '2022-10-01', '2022-12-01'],
          indexes: [4, 5, 6],
        },
      ],
      [
        '2023',
        {
          dates: ['2023-04-01'],
          indexes: [7],
        },
      ],
    ]),
  },
])(
  'sampleDatesByRange with sampleSize $sampleSize and dateRange $dateRange',
  ({ input, sampleSize, output, dateRange }) => {
    const _input = input.map((x) => new Date(x));
    const _output = U.sampleDatesByRange(_input, sampleSize, dateRange);
    for (const [key, value] of _output) {
      const _outputDates = value.dates.map(
        (x) => x.toISOString().split('T')[0]
      );
      // @ts-ignore
      _output.set(key, { ...value, dates: _outputDates });
    }

    expect(_output).toEqual(output);
  }
);
