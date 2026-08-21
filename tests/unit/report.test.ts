import { describe, expect, it } from 'vitest';

import { buildAnalysisReport } from '../../src/domain/analytics/report';
import { createDefaultScopeSelections, detectStints } from '../../src/domain/analytics/stints';
import type { Lap, ParsedWorkbook } from '../../src/domain/model/normalized';
import type { ScopeSelection } from '../../src/domain/model/scope';
import { makeLap } from '../fixtures/scopeLaps';

function reportLaps(): Lap[] {
  return [
    makeLap({
      id: 'alice-1',
      rowNumber: 1,
      driver: 'Alice',
      lapNumber: 1,
      lapTimeUs: 10_000_000,
      sectorsUs: { S1: 4_000_000, S2: 6_000_000 },
    }),
    makeLap({
      id: 'alice-2',
      rowNumber: 2,
      driver: 'Alice',
      lapNumber: 2,
      lapTimeUs: 11_000_000,
      sectorsUs: { S1: 5_000_000, S2: 6_000_000 },
      clean: false,
      pitIn: true,
    }),
    makeLap({
      id: 'bob-1',
      rowNumber: 3,
      driver: 'Bob',
      lapNumber: 1,
      lapTimeUs: 9_000_000,
      sectorsUs: { S1: 4_000_000, S2: 5_000_000 },
    }),
    makeLap({
      id: 'bob-2',
      rowNumber: 4,
      driver: 'Bob',
      lapNumber: 2,
      lapTimeUs: 9_500_000,
      sectorsUs: { S1: 4_000_000, S2: 5_500_000 },
    }),
  ];
}

function parsedWorkbook(laps: readonly Lap[]): ParsedWorkbook {
  return {
    source: {
      id: 'source-a',
      name: 'session-a.xlsx',
      hash: 'a'.repeat(64),
      sheetName: 'Session - Practice',
      driverName: 'Alice, Bob',
      trackName: 'Test Track',
      carName: 'Test Car',
      driverNames: ['Alice', 'Bob'],
      sectorNames: ['S1', 'S2'],
      timedLapCount: laps.filter((lap) => lap.lapTimeUs !== null).length,
      fullTimedLapCount: laps.filter((lap) => lap.isFullTimedLap).length,
      partialLapCount: laps.filter((lap) => !lap.isFullTimedLap).length,
      warningCount: 0,
    },
    laps: [...laps],
    warnings: [],
  };
}

function reportInput() {
  const laps = reportLaps();
  const workbooks = [parsedWorkbook(laps)];
  const selections: ScopeSelection[] = createDefaultScopeSelections(laps);

  return {
    workbooks,
    selections,
    paceMode: 'clean-non-pit' as const,
    generatedAt: '2026-08-21T12:00:00.000Z',
  };
}

describe('canonical analysis report', () => {
  it('derives the report from one fixed input and keeps the important values exact', () => {
    const report = buildAnalysisReport(reportInput());

    expect(report.schemaVersion).toBe('1.0');
    expect(report.configuration.paceMode).toBe('clean-non-pit');
    expect(report.leaderboard.map((row) => row.driver)).toEqual(['Bob', 'Alice']);
    expect(report.leaderboard).toMatchObject([
      {
        position: 1,
        driver: 'Bob',
        runtimeUs: 18_500_000,
        gapUs: 0,
        bestCleanLapUs: 9_000_000,
        medianCleanLapUs: 9_250_000,
      },
      {
        position: 2,
        driver: 'Alice',
        runtimeUs: 21_000_000,
        gapUs: 2_500_000,
        bestCleanLapUs: 10_000_000,
        medianCleanLapUs: 10_000_000,
      },
    ]);
    expect(report.drivers[0]).toMatchObject({
      driver: 'Alice',
      runtimeUs: 21_000_000,
      runtimeLapCount: 2,
      paceLapCount: 1,
      cleanLapCount: 1,
      eligibleNonPitLapCount: 1,
      cleanPercentage: 100,
      bestCleanLapUs: 10_000_000,
      medianCleanLapUs: 10_000_000,
      lapStats: { n: 1, bestUs: 10_000_000, medianUs: 10_000_000, sdUs: 0 },
      theoreticalBestUs: 10_000_000,
      executionGapUs: 0,
    });
    expect(report.sectors).toMatchObject([
      {
        sector: 'S1',
        benchmark: { bestMeanUs: 4_000_000, bestMedianUs: 4_000_000 },
      },
      {
        sector: 'S2',
        benchmark: { bestMeanUs: 5_250_000, bestMedianUs: 5_250_000 },
      },
    ]);
    expect(report.stints).toHaveLength(2);
    expect(report.stints[0]?.progression).toHaveLength(1);
    expect(report.lapAudit.find((row) => row.id === 'alice-2')).toMatchObject({
      runtimeEligible: true,
      paceEligible: false,
      runtimeExclusionReasons: [],
      paceExclusionReasons: ['pit-in', 'clean-false'],
    });
    expect(report.warnings.map((warning) => warning.code)).toContain('low-sector-sample');
    expect(report.warnings.map((warning) => warning.code)).toContain('different-pace-sample-sizes');
  });

  it('builds the same report again for the same input', () => {
    const input = reportInput();

    expect(buildAnalysisReport(input)).toEqual(buildAnalysisReport(input));
  });

  it('keeps standings on runtime and separates best and median clean laps', () => {
    const input = reportInput();
    const baseline = buildAnalysisReport(input);
    const workbook = input.workbooks[0];
    if (!workbook) {
      throw new Error('The test needs one workbook.');
    }

    const changed = buildAnalysisReport({
      ...input,
      workbooks: [
        {
          ...workbook,
          laps: workbook.laps.map((lap) => (lap.id === 'bob-1' ? { ...lap, clean: false } : lap)),
        },
      ],
    });

    expect(
      changed.leaderboard.map(({ driver, position, runtimeUs, gapUs }) => ({
        driver,
        position,
        runtimeUs,
        gapUs,
      })),
    ).toEqual(
      baseline.leaderboard.map(({ driver, position, runtimeUs, gapUs }) => ({
        driver,
        position,
        runtimeUs,
        gapUs,
      })),
    );
    expect(changed.leaderboard.find((row) => row.driver === 'Bob')).toMatchObject({
      bestCleanLapUs: 9_500_000,
      medianCleanLapUs: 9_500_000,
    });
  });

  it('omits drivers without selected full timed runtime laps from standings', () => {
    const input = reportInput();
    const workbook = input.workbooks[0];
    if (!workbook) {
      throw new Error('The test needs one workbook.');
    }

    const partialDriver = makeLap({
      id: 'cara-partial',
      driver: 'Cara',
      lapTimeUs: null,
      sectorsUs: { S1: null, S2: null },
      isFullTimedLap: false,
      classification: 'partial',
      exclusionReason: 'One or more sector times are missing.',
    });
    const report = buildAnalysisReport({
      ...input,
      workbooks: [{ ...workbook, laps: [...workbook.laps, partialDriver] }],
    });

    expect(report.drivers.map((driver) => driver.driver)).toContain('Cara');
    expect(report.leaderboard.map((row) => row.driver)).not.toContain('Cara');
  });

  it('uses the selected exploratory pace mode in the report methodology', () => {
    const input = reportInput();
    const workbook = input.workbooks[0];
    if (!workbook) {
      throw new Error('The test needs one workbook.');
    }
    const exploratoryLaps = workbook.laps.map((lap) =>
      lap.id === 'alice-1' ? { ...lap, clean: false } : lap,
    );

    const report = buildAnalysisReport({
      ...input,
      workbooks: [{ ...workbook, laps: exploratoryLaps }],
      paceMode: 'all-non-pit',
    });

    expect(report.configuration.paceMode).toBe('all-non-pit');
    expect(report.methodology.pace).toContain('Clean status does not filter pace');
    expect(report.drivers.find((driver) => driver.driver === 'Alice')?.paceLapCount).toBe(1);
    expect(detectStints(reportLaps())).toHaveLength(2);
  });
});
