// See Path/getPath2D

import { type SkPoint } from '@shopify/react-native-skia';

export const magnitude = (p: SkPoint): number =>
  Math.sqrt(p.x * p.x + p.y * p.y);

export const normalize = (p: SkPoint) => {
  const m = magnitude(p);
  return { x: p.x / m, y: p.y / m } as SkPoint;
};
