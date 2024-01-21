export type WeightItem = {
  date: string;
  weight: number;
  body_fat: number | null;
};

const WEIGHT_DATA: WeightItem[] = require('../assets/data/weight.json');

const WEIGHT = WEIGHT_DATA.filter((x) => x.weight !== null).map(
  (x) => [new Date(x.date).getTime(), x.weight] as [number, number]
);

const BODY_FAT = WEIGHT_DATA.filter((x) => x.body_fat !== null).map(
  (x) => [new Date(x.date).getTime(), x.body_fat] as [number, number]
);

export { BODY_FAT, WEIGHT, WEIGHT_DATA };

export const MONTHLY_DATA = [
  { value: 0.5, label: 'Jan' },
  { value: 0.2, label: 'Feb' },
  { value: 0.3, label: 'Mar' },
  { value: 0.4, label: 'Apr' },
  { value: 0.5, label: 'May' },
  { value: 0.6, label: 'Jun' },
  { value: 0.3, label: 'Jul' },
];

export const MONTHLY_DATA_2 = [
  { value: 10, label: 'Jan' },
  { value: 1, label: 'Feb' },
  { value: 5, label: 'Mar' },
  { value: 0, label: 'Apr' },
  { value: 7, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 3, label: 'Jul' },
];

// console.log(WEIGHT);
