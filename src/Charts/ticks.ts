const NICE_FACTORS = [1, 2, 2.5, 5];

/**
 * Exactly `count` round ticks covering [minValue, maxValue], stepping by 1, 2, 2.5 or 5 × 10ⁿ.
 * Two axes built with the same `count` share their gridlines, e.g. kg on the left and % on the right.
 */
export const getAlignedTicks = function (
  minValue: number,
  maxValue: number,
  count: number
): number[] {
  if (!Number.isInteger(count) || count < 2)
    throw new Error('getAlignedTicks needs at least 2 ticks');
  const segments = count - 1;
  const span = maxValue - minValue;
  if (!(span >= 0)) throw new Error('getAlignedTicks needs minValue <= maxValue');
  if (span === 0) {
    // A flat series sits mid-axis: pad by half its order of magnitude
    const pad = 10 ** Math.floor(Math.log10(Math.abs(maxValue) || 1)) / 2;
    return getAlignedTicks(minValue - pad, maxValue + pad, count);
  }
  const raw = span / segments;
  let magnitude = 10 ** Math.floor(Math.log10(raw));
  // Two decades always contain a step whose snapped range covers the data
  for (let decade = 0; decade < 2; decade++, magnitude *= 10)
    for (const factor of NICE_FACTORS) {
      const step = factor * magnitude;
      if (step < raw) continue;
      const start = Math.floor(minValue / step) * step;
      if (start + segments * step < maxValue) continue;
      // Rounded to the step's precision to drop float noise (0.1 + 0.2)
      const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
      return Array.from({ length: count }, (_, i) =>
        Number((start + i * step).toFixed(decimals))
      );
    }
  return Array.from({ length: count }, (_, i) => minValue + (i * span) / segments);
};
