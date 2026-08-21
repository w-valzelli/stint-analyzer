import { describe, expect, it } from 'vitest';

import {
  iqrOutlierCount,
  iqrOutlierFlags,
  numericStats,
} from '../../src/domain/analytics/statistics';

describe('numeric statistics', () => {
  it('returns the selected population statistics', () => {
    const stats = numericStats([1, 2, 3, 4]);

    expect(stats).toMatchObject({
      n: 4,
      min: 1,
      max: 4,
      best: 1,
      mean: 2.5,
      median: 2.5,
      q1: 1.75,
      q3: 3.25,
      iqr: 1.5,
      mad: 1,
      range: 3,
      pctWithin100: 100,
      pctWithin200: 100,
      pctWithin500: 100,
      outlierCountIqr: 0,
    });
    expect(stats.sd).toBeCloseTo(Math.sqrt(1.25));
  });

  it('returns zero dispersion for one value', () => {
    expect(numericStats([42])).toMatchObject({
      n: 1,
      min: 42,
      max: 42,
      mean: 42,
      median: 42,
      sd: 0,
      mad: 0,
      q1: 42,
      q3: 42,
      iqr: 0,
      range: 0,
      outlierCountIqr: 0,
    });
  });

  it('returns nullable metrics for an empty sample', () => {
    expect(numericStats([])).toEqual({
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
    });
  });

  it('flags IQR outliers without removing them from statistics', () => {
    const values = [1, 2, 3, 4, 100];

    expect(iqrOutlierFlags(values)).toEqual([false, false, false, false, true]);
    expect(iqrOutlierCount(values)).toBe(1);
    expect(numericStats(values).mean).toBe(22);
  });

  it('measures proximity at or below the median bands', () => {
    expect(numericStats([100, 250, 400])).toMatchObject({
      median: 250,
      pctWithin100: (2 / 3) * 100,
      pctWithin200: 100,
      pctWithin500: 100,
    });
  });

  it('rejects non-finite input', () => {
    expect(() => numericStats([1, Number.NaN])).toThrow(
      'Statistics require finite numeric values.',
    );
  });
});
