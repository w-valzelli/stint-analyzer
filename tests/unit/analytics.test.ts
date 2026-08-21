import { describe, expect, it } from 'vitest';

import { deriveLapEligibility } from '../../src/domain/analytics/eligibility';
import {
  cleanLapPercentage,
  driverLapAnalyses,
  sumRuntimeUs,
} from '../../src/domain/analytics/laps';
import { calculateStintProgression } from '../../src/domain/analytics/progression';
import {
  calculateSectorBenchmarks,
  calculateSectorGaps,
  calculateSectorStats,
  calculateTheoreticalBests,
} from '../../src/domain/analytics/sectors';
import { numericStats } from '../../src/domain/analytics/statistics';
import { detectStints, groupLapsByDriver } from '../../src/domain/analytics/stints';
import type { Lap } from '../../src/domain/model/normalized';
import type { ScopeSelection } from '../../src/domain/model/scope';
import { makeLap } from '../fixtures/scopeLaps';

function analyticsFixture(): Lap[] {
  return [
    makeLap({
      id: 'alice-1',
      rowNumber: 1,
      lapNumber: 1,
      lapTimeUs: 10_000_000,
      sectorsUs: { S1: 4_000_000, S2: 6_000_000 },
    }),
    makeLap({
      id: 'alice-2',
      rowNumber: 2,
      lapNumber: 2,
      lapTimeUs: 11_000_000,
      sectorsUs: { S1: 5_000_000, S2: 6_000_000 },
      clean: false,
      pitIn: true,
    }),
    makeLap({
      id: 'alice-3',
      rowNumber: 3,
      lapNumber: 3,
      lapTimeUs: 12_000_000,
      sectorsUs: { S1: 3_000_000, S2: 9_000_000 },
      pitOut: true,
    }),
    makeLap({
      id: 'alice-4',
      rowNumber: 4,
      lapNumber: 4,
      lapTimeUs: 12_000_000,
      sectorsUs: { S1: 3_000_000, S2: 9_000_000 },
    }),
    makeLap({
      id: 'alice-5',
      rowNumber: 5,
      lapNumber: 5,
      lapTimeUs: 11_000_000,
      sectorsUs: { S1: 5_000_000, S2: 6_000_000 },
      clean: false,
    }),
    makeLap({
      id: 'bob-1',
      rowNumber: 6,
      driver: 'Bob',
      lapNumber: 1,
      lapTimeUs: 10_000_000,
      sectorsUs: { S1: 4_000_000, S2: 6_000_000 },
    }),
    makeLap({
      id: 'bob-2',
      rowNumber: 7,
      driver: 'Bob',
      lapNumber: 2,
      lapTimeUs: 10_000_000,
      sectorsUs: { S1: 4_000_000, S2: 6_000_000 },
    }),
  ];
}

function deriveAll(
  laps: readonly Lap[],
  paceMode: 'clean-non-pit' | 'all-non-pit' = 'clean-non-pit',
) {
  const stints = detectStints(laps);
  const selections: ScopeSelection[] = groupLapsByDriver(laps).map((group) => ({
    scopeKey: group.scopeKey,
    selectedStintIds: group.stints.map((stint) => stint.id),
  }));
  const eligibility = deriveLapEligibility(laps, selections, stints, paceMode);
  return { stints, eligibility };
}

describe('lap analytics', () => {
  it('sums selected timed laps independently from clean and pit flags', () => {
    const laps = analyticsFixture();
    const { eligibility } = deriveAll(laps);

    expect(sumRuntimeUs(laps, eligibility)).toBe(76_000_000);
    expect(cleanLapPercentage(laps, eligibility)).toEqual({
      cleanCount: 4,
      eligibleNonPitCount: 5,
      percentage: 80,
    });
  });

  it('calculates driver lap statistics from pace-eligible laps', () => {
    const laps = analyticsFixture();
    const { eligibility } = deriveAll(laps);
    const analyses = driverLapAnalyses(laps, eligibility);

    expect(analyses).toMatchObject([
      {
        driver: 'Alice',
        runtimeLaps: 5,
        paceLaps: 2,
        runtimeUs: 56_000_000,
        lapStats: {
          n: 2,
          best: 10_000_000,
          mean: 11_000_000,
          median: 11_000_000,
          pctWithin100: 50,
        },
      },
      {
        driver: 'Bob',
        runtimeLaps: 2,
        paceLaps: 2,
        runtimeUs: 20_000_000,
        lapStats: { n: 2, best: 10_000_000, mean: 10_000_000, median: 10_000_000 },
      },
    ]);
  });

  it('averages fuel use across selected full timed non-pit laps', () => {
    const laps = [
      makeLap({ id: 'fuel-clean', rowNumber: 1, fuelUsed: 5 }),
      makeLap({ id: 'fuel-dirty', rowNumber: 2, fuelUsed: 7, clean: false }),
      makeLap({ id: 'fuel-pit', rowNumber: 3, fuelUsed: 50, pitIn: true }),
      makeLap({ id: 'fuel-out-of-scope', rowNumber: 4, fuelUsed: 90, run: 2 }),
      makeLap({
        id: 'fuel-partial',
        rowNumber: 5,
        fuelUsed: 100,
        run: 2,
        lapTimeUs: null,
        sectorsUs: { S1: null, S2: null },
        isFullTimedLap: false,
        classification: 'partial',
        exclusionReason: 'One or more sector times are missing.',
      }),
    ];
    const stints = detectStints(laps);
    const selectedStint = stints.find((stint) => stint.lapIds.includes('fuel-clean'));
    if (!selectedStint) {
      throw new Error('The fuel fixture needs a selected stint.');
    }
    const scopeGroup = groupLapsByDriver(laps)[0];
    if (!scopeGroup) {
      throw new Error('The fuel fixture needs a driver scope.');
    }
    const eligibility = deriveLapEligibility(
      laps,
      [{ scopeKey: scopeGroup.scopeKey, selectedStintIds: [selectedStint.id] }],
      stints,
      'clean-non-pit',
    );

    expect(driverLapAnalyses(laps, eligibility)[0]).toMatchObject({
      fuelUsedMeanLiters: 6,
      fuelUsedLapCount: 2,
    });
  });

  it('uses all non-pit laps when exploratory pace mode is selected', () => {
    const laps = analyticsFixture();
    const { eligibility } = deriveAll(laps, 'all-non-pit');

    expect(driverLapAnalyses(laps, eligibility)[0]?.paceLaps).toBe(3);
  });
});

describe('sector analytics', () => {
  it('discovers sectors and calculates driver statistics', () => {
    const laps = analyticsFixture();
    const { eligibility } = deriveAll(laps);
    const entries = calculateSectorStats(laps, eligibility);

    expect(entries.map((entry) => [entry.driver, entry.sector])).toEqual([
      ['Alice', 'S1'],
      ['Alice', 'S2'],
      ['Bob', 'S1'],
      ['Bob', 'S2'],
    ]);
    expect(entries[0]?.stats).toMatchObject({ n: 2, best: 3_000_000, median: 3_500_000 });
    expect(entries[1]?.stats).toMatchObject({ n: 2, best: 6_000_000, median: 7_500_000 });
  });

  it('calculates tied benchmarks and non-negative gaps', () => {
    const entries = [
      { driver: 'Alice', sector: 'S1', stats: numericStats([100, 110]) },
      { driver: 'Bob', sector: 'S1', stats: numericStats([100, 120]) },
    ];
    const benchmarks = calculateSectorBenchmarks(entries);
    const gaps = calculateSectorGaps(entries, benchmarks);

    expect(benchmarks).toEqual([
      { sector: 'S1', bestSingleUs: 100, bestMeanUs: 105, bestMedianUs: 105 },
    ]);
    expect(gaps.map((entry) => entry.gapToBestMeanUs)).toEqual([0, 5]);
    expect(gaps.every((entry) => (entry.gapToBestMedianUs ?? 0) >= 0)).toBe(true);
  });

  it('returns a theoretical best and execution gap from personal best sectors', () => {
    const laps = analyticsFixture();
    const { eligibility } = deriveAll(laps);
    const sectorStats = calculateSectorStats(laps, eligibility);
    const lapAnalyses = driverLapAnalyses(laps, eligibility);
    const theoretical = calculateTheoreticalBests(sectorStats, lapAnalyses);

    expect(theoretical[0]).toEqual({
      driver: 'Alice',
      bestActualUs: 10_000_000,
      theoreticalBestUs: 9_000_000,
      executionGapUs: 1_000_000,
    });
  });

  it('preserves a negative execution gap when sector totals exceed the best lap', () => {
    const theoretical = calculateTheoreticalBests(
      [
        { driver: 'Alice', sector: 'S1', stats: numericStats([6]) },
        { driver: 'Alice', sector: 'S2', stats: numericStats([6]) },
      ],
      [{ driver: 'Alice', lapStats: numericStats([10]) }],
    );

    expect(theoretical[0]?.executionGapUs).toBe(-2);
  });
});

describe('stint progression', () => {
  it('uses pace laps and driver sector medians for deltas', () => {
    const laps = analyticsFixture();
    const { eligibility, stints } = deriveAll(laps);
    const sectorStats = calculateSectorStats(laps, eligibility);
    const progression = calculateStintProgression(laps, eligibility, stints, sectorStats);
    const firstAlice = progression.find((stint) => stint.driver === 'Alice');

    expect(progression).toHaveLength(3);
    expect(firstAlice).toMatchObject({ medianLapUs: 10_000_000 });
    expect(firstAlice?.laps[0]).toMatchObject({
      lapId: 'alice-1',
      lapIndex: 1,
      lapTimeUs: 10_000_000,
      deltaToStintMedianUs: 0,
      sectorDeltaUs: { S1: 500_000, S2: -1_500_000 },
    });
  });
});
