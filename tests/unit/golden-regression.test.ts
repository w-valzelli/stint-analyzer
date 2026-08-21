import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildAnalysisReport } from '../../src/domain/analytics/report';
import { createDefaultScopeSelections, detectStints } from '../../src/domain/analytics/stints';
import { parseWorkbookFile } from '../../src/domain/parsing/workbook';
import { goldenExpected } from '../fixtures/goldenExpected';

const fixturePath = path.resolve('tests/fixtures/golden-garage61-session.xlsx');
const source = {
  id: 'golden-source',
  name: 'golden-garage61-session.xlsx',
  hash: '7'.repeat(64),
};

async function buildGoldenReport() {
  const bytes = await readFile(fixturePath);
  const workbook = await parseWorkbookFile(new Uint8Array(bytes).buffer, source);
  const selections = createDefaultScopeSelections(workbook.laps);
  const report = buildAnalysisReport({
    workbooks: [workbook],
    selections,
    paceMode: 'clean-non-pit',
    generatedAt: '2026-01-10T12:00:00.000Z',
  });

  return { workbook, report };
}

describe('golden Garage 61 regression fixture', () => {
  it('round-trips the synthetic workbook and exposes the expected fixture shape', async () => {
    const { workbook, report } = await buildGoldenReport();
    const selectableStints = detectStints(workbook.laps).filter(
      (stint) => stint.fullTimedLapCount > 0,
    );

    expect(workbook.source.driverNames).toEqual(goldenExpected.source.drivers);
    expect(workbook.source.sectorNames).toEqual(goldenExpected.source.sectors);
    expect(workbook.source.fullTimedLapCount).toBe(goldenExpected.source.fullTimedLapCount);
    expect(workbook.source.partialLapCount).toBe(goldenExpected.source.partialLapCount);
    expect(selectableStints).toHaveLength(goldenExpected.source.selectableStintCount);
    expect(
      goldenExpected.source.drivers.map(
        (driver) => selectableStints.filter((stint) => stint.driver === driver).length,
      ),
    ).toEqual([2, 2, 2]);
    expect(workbook.laps.filter((lap) => lap.lapNumber === 0 && !lap.isFullTimedLap)).toHaveLength(
      3,
    );
    expect(workbook.laps.filter((lap) => lap.lapNumber === 7 && !lap.isFullTimedLap)).toHaveLength(
      3,
    );
    expect(workbook.laps.filter((lap) => lap.clean === false)).toHaveLength(2);
    expect(workbook.laps.every((lap) => lap.fuelLevel !== null)).toBe(true);
    expect(report.lapAudit.filter((lap) => lap.pitIn)).toHaveLength(
      goldenExpected.source.pitInLapCount,
    );
    expect(report.lapAudit.filter((lap) => lap.pitOut)).toHaveLength(
      goldenExpected.source.pitOutLapCount,
    );
  });

  it('keeps the runtime standings, clean fractions, and lap statistics golden', async () => {
    const { report } = await buildGoldenReport();

    expect(report.leaderboard).toHaveLength(goldenExpected.leaderboard.length);
    expect(report.leaderboard.reduce((count, row) => count + row.lapStats.outlierCountIqr, 0)).toBe(
      1,
    );
    for (const expected of goldenExpected.leaderboard) {
      const actual = report.leaderboard.find((row) => row.driver === expected.driver);

      expect(actual).toBeDefined();
      expect(actual?.position).toBe(expected.position);
      expect(actual?.runtimeUs).toBe(expected.runtimeUs);
      expect(actual?.gapUs).toBe(expected.gapUs);
      expect(actual?.cleanLapCount).toBe(expected.cleanLapCount);
      expect(actual?.eligibleNonPitLapCount).toBe(expected.eligibleNonPitLapCount);
      expect(actual?.cleanPercentage).toBe(expected.cleanPercentage);
      expect(actual?.lapStats.n).toBe(expected.lapStats.n);
      expect(actual?.lapStats.bestUs).toBe(expected.lapStats.bestUs);
      expect(actual?.lapStats.meanUs).toBeCloseTo(expected.lapStats.meanUs, 6);
      expect(actual?.lapStats.medianUs).toBe(expected.lapStats.medianUs);
      expect(actual?.lapStats.sdUs).toBeCloseTo(expected.lapStats.sdUs, 6);
      expect(actual?.lapStats.madUs).toBe(expected.lapStats.madUs);
      expect(actual?.lapStats.iqrUs).toBe(expected.lapStats.iqrUs);
      expect(actual?.lapStats.outlierCountIqr).toBe(expected.lapStats.outlierCountIqr);
      expect(actual?.theoreticalBestUs).toBe(expected.theoreticalBestUs);
    }
  });

  it('keeps the sector benchmark and median gaps golden', async () => {
    const { report } = await buildGoldenReport();
    const sector = report.sectors.find((entry) => entry.sector === 'S1');

    expect(sector).toBeDefined();
    expect(sector?.benchmark.bestSingleUs).toBe(goldenExpected.s1Benchmark.bestSingleUs);
    expect(sector?.benchmark.bestMeanUs).toBeCloseTo(goldenExpected.s1Benchmark.bestMeanUs, 6);
    expect(sector?.benchmark.bestMedianUs).toBe(goldenExpected.s1Benchmark.bestMedianUs);

    for (const [driver, gapUs] of Object.entries(goldenExpected.s1Benchmark.medianGapsUs)) {
      expect(sector?.drivers.find((entry) => entry.driver === driver)?.gapToBestMedianUs).toBe(
        gapUs,
      );
    }
  });
});
