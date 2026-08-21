import {
  extent,
  interquartileRange,
  mean,
  median,
  medianAbsoluteDeviation,
  quantile,
  standardDeviation,
} from 'simple-statistics';

export type NullableNumericStats = {
  n: number;
  min: number | null;
  max: number | null;
  best: number | null;
  mean: number | null;
  median: number | null;
  sd: number | null;
  mad: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  range: number | null;
  pctWithin100: number | null;
  pctWithin200: number | null;
  pctWithin500: number | null;
  outlierCountIqr: number;
};

export type MedianProximity = Pick<
  NullableNumericStats,
  'pctWithin100' | 'pctWithin200' | 'pctWithin500'
>;

function assertFiniteValues(values: readonly number[]): void {
  if (values.some((value) => !Number.isFinite(value))) {
    throw new TypeError('Statistics require finite numeric values.');
  }
}

function emptyStats(): NullableNumericStats {
  return {
    n: 0,
    min: null,
    max: null,
    best: null,
    mean: null,
    median: null,
    sd: null,
    mad: null,
    q1: null,
    q3: null,
    iqr: null,
    range: null,
    pctWithin100: null,
    pctWithin200: null,
    pctWithin500: null,
    outlierCountIqr: 0,
  };
}

function medianProximity(
  values: readonly number[],
  center: number,
  thresholds: readonly [number, number, number],
): MedianProximity {
  const percentageWithin = (threshold: number): number =>
    (values.filter((value) => value <= center + threshold).length / values.length) * 100;

  return {
    pctWithin100: percentageWithin(thresholds[0]),
    pctWithin200: percentageWithin(thresholds[1]),
    pctWithin500: percentageWithin(thresholds[2]),
  };
}

export function iqrOutlierFlags(values: readonly number[]): boolean[] {
  assertFiniteValues(values);
  if (values.length === 0) {
    return [];
  }

  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const spread = q3 - q1;
  const lower = q1 - 1.5 * spread;
  const upper = q3 + 1.5 * spread;

  return values.map((value) => value < lower || value > upper);
}

export function iqrOutlierCount(values: readonly number[]): number {
  return iqrOutlierFlags(values).filter(Boolean).length;
}

export function numericStats(
  values: readonly number[],
  proximityThresholds: readonly [number, number, number] = [100, 200, 500],
): NullableNumericStats {
  assertFiniteValues(values);
  if (values.length === 0) {
    return emptyStats();
  }

  const [min, max] = extent(values);
  const center = median(values);
  const proximity = medianProximity(values, center, proximityThresholds);

  return {
    n: values.length,
    min,
    max,
    best: min,
    mean: mean(values),
    median: center,
    sd: standardDeviation(values),
    mad: medianAbsoluteDeviation(values),
    q1: quantile(values, 0.25),
    q3: quantile(values, 0.75),
    iqr: interquartileRange(values),
    range: max - min,
    ...proximity,
    outlierCountIqr: iqrOutlierCount(values),
  };
}

export const durationProximityThresholdsUs = [100_000, 200_000, 500_000] as const;

export function durationStats(values: readonly number[]): NullableNumericStats {
  return numericStats(values, durationProximityThresholdsUs);
}
