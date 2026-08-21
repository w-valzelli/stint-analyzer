import type { ParsedWorkbook, ParserWarning } from '../model/normalized';
import {
  analysisReportSchema,
  type AnalysisReport,
  type AnalysisWarning,
  type DriverAnalysis,
  type DriverSectorAnalysis,
  type LapAuditRow,
  type MetricStats,
  type SectorAnalysis,
  type StintAnalysis,
} from '../model/report';
import type { PaceMode, ScopeSelection } from '../model/scope';
import { deriveLapEligibility } from './eligibility';
import { driverLapAnalyses, paceEligibleLaps, runtimeEligibleLaps } from './laps';
import { calculateStintProgression } from './progression';
import {
  calculateSectorBenchmarks,
  calculateSectorGaps,
  calculateSectorStats,
  calculateTheoreticalBests,
  sectorNamesForLaps,
} from './sectors';
import { detectStints } from './stints';
import { buildConsistencySummaries, buildOverviewSummary, medianRankForDriver } from './summaries';
import type { NullableNumericStats } from './statistics';

export type BuildAnalysisReportInput = {
  workbooks: readonly ParsedWorkbook[];
  selections: readonly ScopeSelection[];
  paceMode: PaceMode;
  generatedAt: string;
};

function methodologyFor(paceMode: PaceMode) {
  return {
    runtime: 'Sum full timed laps in the selected stints. Clean status does not affect runtime.',
    pace:
      paceMode === 'clean-non-pit'
        ? 'Use full timed, clean, non-pit laps in selected stints.'
        : 'Use full timed, non-pit laps in selected stints. Clean status does not filter pace.',
    cleanPercentage:
      'Clean percentage is clean full timed non-pit laps divided by all full timed non-pit laps in selected stints.',
    standardDeviation: 'Use population standard deviation for the selected sample.',
    outliers:
      'Flag IQR outliers below Q1 - 1.5 × IQR or above Q3 + 1.5 × IQR. Do not remove flagged values from statistics.',
    theoreticalBest:
      'Sum each driver’s personal best eligible sector. This result is theoretical, not an actual lap.',
    penalties:
      'This milestone reports runtime only. Clean status remains a lap-quality fact and does not create penalties.',
  } as const;
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function compareSources(left: ParsedWorkbook, right: ParsedWorkbook): number {
  return (
    compareText(left.source.name, right.source.name) || compareText(left.source.id, right.source.id)
  );
}

function toMetricStats(stats: NullableNumericStats): MetricStats {
  return {
    n: stats.n,
    bestUs: stats.best,
    worstUs: stats.max,
    meanUs: stats.mean,
    medianUs: stats.median,
    sdUs: stats.sd,
    madUs: stats.mad,
    q1Us: stats.q1,
    q3Us: stats.q3,
    iqrUs: stats.iqr,
    rangeUs: stats.range,
    pctWithin100msOfMedian: stats.pctWithin100,
    pctWithin200msOfMedian: stats.pctWithin200,
    pctWithin500msOfMedian: stats.pctWithin500,
    outlierCountIqr: stats.outlierCountIqr,
  };
}

function seconds(valueUs: number): string {
  return `${(valueUs / 1_000_000).toFixed(3)} s`;
}

function signedSeconds(valueUs: number): string {
  return `${valueUs >= 0 ? '+' : ''}${seconds(valueUs)}`;
}

function observationsForDriver(
  driver: string,
  sectorGaps: readonly ReturnType<typeof calculateSectorGaps>[number][],
  executionGapUs: number | null,
): string[] {
  const observations: string[] = [];
  const medianGaps = sectorGaps.filter((entry) => entry.gapToBestMedianUs !== null);
  const sdEntries = sectorGaps.filter((entry) => entry.stats.sd !== null);

  if (medianGaps.length > 0) {
    const closest = [...medianGaps].sort(
      (left, right) =>
        (left.gapToBestMedianUs as number) - (right.gapToBestMedianUs as number) ||
        compareText(left.sector, right.sector),
    )[0];
    const largest = [...medianGaps].sort(
      (left, right) =>
        (right.gapToBestMedianUs as number) - (left.gapToBestMedianUs as number) ||
        compareText(left.sector, right.sector),
    )[0];

    observations.push(
      `${closest.sector} is closest to the median sector benchmark (${signedSeconds(closest.gapToBestMedianUs as number)} gap).`,
    );
    observations.push(
      `${largest.sector} has the largest median deficit (${signedSeconds(largest.gapToBestMedianUs as number)}).`,
    );
  }

  if (sdEntries.length > 0) {
    const highestSd = [...sdEntries].sort(
      (left, right) =>
        (right.stats.sd as number) - (left.stats.sd as number) ||
        compareText(left.sector, right.sector),
    )[0];
    observations.push(
      `${highestSd.sector} has the highest sector SD (${seconds(highestSd.stats.sd as number)}).`,
    );
  }

  if (executionGapUs !== null) {
    observations.push(
      `${driver}'s best actual lap is ${signedSeconds(executionGapUs)} from the theoretical best.`,
    );
  }

  return observations;
}

type WarningBaseInput = {
  kind: AnalysisWarning['kind'];
  code: string;
  severity: AnalysisWarning['severity'];
  message: string;
  sourceFileName?: string | null;
  rowNumber?: number | null;
  driver?: string | null;
  sector?: string | null;
};

function warningBase({
  kind,
  code,
  severity,
  message,
  sourceFileName = null,
  rowNumber = null,
  driver = null,
  sector = null,
}: WarningBaseInput): AnalysisWarning {
  return { kind, code, severity, message, sourceFileName, rowNumber, driver, sector };
}

function parserWarningToAnalysisWarning(warning: ParserWarning): AnalysisWarning {
  return warningBase({
    kind: 'parser',
    code: warning.code,
    severity: warning.severity,
    message: warning.message,
    sourceFileName: warning.sourceFileName,
    rowNumber: warning.rowNumber,
  });
}

function countDescription(values: readonly { driver: string; count: number }[]): string {
  return values.map((value) => `${value.driver} ${value.count}`).join(', ');
}

type AnalysisWarningContext = {
  workbooks: readonly ParsedWorkbook[];
  laps: Parameters<typeof driverLapAnalyses>[0];
  eligibility: Parameters<typeof driverLapAnalyses>[1];
  lapAnalyses: ReturnType<typeof driverLapAnalyses>;
  sectorGaps: readonly ReturnType<typeof calculateSectorGaps>[number][];
};

function analysisWarnings({
  workbooks,
  laps,
  eligibility,
  lapAnalyses,
  sectorGaps,
}: AnalysisWarningContext): AnalysisWarning[] {
  const warnings = workbooks.flatMap((workbook) =>
    workbook.warnings.map(parserWarningToAnalysisWarning),
  );
  const runtimeCounts = lapAnalyses.map((analysis) => ({
    driver: analysis.driver,
    count: analysis.runtimeLaps,
  }));
  const paceCounts = lapAnalyses.map((analysis) => ({
    driver: analysis.driver,
    count: analysis.paceLaps,
  }));

  if (new Set(runtimeCounts.map((value) => value.count)).size > 1) {
    warnings.push(
      warningBase({
        kind: 'analysis',
        code: 'different-runtime-lengths',
        severity: 'warning',
        message: `Selected runtime lap counts differ between drivers: ${countDescription(runtimeCounts)}.`,
      }),
    );
  }

  if (new Set(paceCounts.map((value) => value.count)).size > 1) {
    warnings.push(
      warningBase({
        kind: 'analysis',
        code: 'different-pace-sample-sizes',
        severity: 'warning',
        message: `Eligible pace lap counts differ between drivers: ${countDescription(paceCounts)}.`,
      }),
    );
  }

  const drivers = [...new Set(laps.map((lap) => lap.driver))].sort(compareText);
  for (const driver of drivers) {
    const driverLaps = laps.filter((lap) => lap.driver === driver);
    const driverEligibility = eligibility.filter((item) => item.driver === driver);
    const missingCleanCount = runtimeEligibleLaps(driverLaps, driverEligibility).filter(
      (lap) => !lap.pitIn && !lap.pitOut && lap.clean === null,
    ).length;
    if (missingCleanCount > 0) {
      warnings.push(
        warningBase({
          kind: 'analysis',
          code: 'missing-clean-status',
          severity: 'warning',
          message: `${driver} has ${missingCleanCount} selected full timed non-pit lap${missingCleanCount === 1 ? '' : 's'} without Clean status.`,
          driver,
        }),
      );
    }
  }

  for (const entry of sectorGaps) {
    if (entry.stats.n < 3) {
      warnings.push(
        warningBase({
          kind: 'analysis',
          code: 'low-sector-sample',
          severity: 'info',
          message: `${entry.driver} ${entry.sector} has only ${entry.stats.n} eligible sector sample${entry.stats.n === 1 ? '' : 's'}.`,
          driver: entry.driver,
          sector: entry.sector,
        }),
      );
    }
  }

  const layouts = workbooks.map((workbook) => ({
    name: workbook.source.name,
    sectors: [...workbook.source.sectorNames].sort(compareText),
  }));
  if (new Set(layouts.map((layout) => JSON.stringify(layout.sectors))).size > 1) {
    warnings.push(
      warningBase({
        kind: 'analysis',
        code: 'inconsistent-sector-layout',
        severity: 'warning',
        message: `Selected sources expose different sector layouts: ${layouts
          .sort((left, right) => compareText(left.name, right.name))
          .map((layout) => `${layout.name} [${layout.sectors.join(', ')}]`)
          .join('; ')}.`,
      }),
    );
  }

  return warnings.sort(
    (left, right) =>
      compareText(left.kind, right.kind) ||
      compareText(left.code, right.code) ||
      compareText(left.sourceFileName ?? '', right.sourceFileName ?? '') ||
      compareText(left.driver ?? '', right.driver ?? '') ||
      compareText(left.sector ?? '', right.sector ?? '') ||
      (left.rowNumber ?? 0) - (right.rowNumber ?? 0) ||
      compareText(left.message, right.message),
  );
}

function buildSectorAnalyses(
  sectorGaps: readonly ReturnType<typeof calculateSectorGaps>[number][],
  benchmarks: readonly ReturnType<typeof calculateSectorBenchmarks>[number][],
  sectors: readonly string[],
): SectorAnalysis[] {
  const benchmarksBySector = new Map(benchmarks.map((benchmark) => [benchmark.sector, benchmark]));

  return sectors.map((sector) => {
    const benchmark = benchmarksBySector.get(sector);
    return {
      sector,
      benchmark: {
        bestSingleUs: benchmark?.bestSingleUs ?? null,
        bestMeanUs: benchmark?.bestMeanUs ?? null,
        bestMedianUs: benchmark?.bestMedianUs ?? null,
      },
      drivers: sectorGaps
        .filter((entry) => entry.sector === sector)
        .sort((left, right) => compareText(left.driver, right.driver))
        .map((entry) => ({
          driver: entry.driver,
          ...toMetricStats(entry.stats),
          gapToBestSingleUs: entry.gapToBestSingleUs,
          gapToBestMeanUs: entry.gapToBestMeanUs,
          gapToBestMedianUs: entry.gapToBestMedianUs,
        })),
    };
  });
}

function buildLapAudit(
  laps: Parameters<typeof driverLapAnalyses>[0],
  eligibility: Parameters<typeof driverLapAnalyses>[1],
): LapAuditRow[] {
  const eligibilityById = new Map(eligibility.map((item) => [item.lapId, item]));

  return laps
    .flatMap((lap) => {
      const result = eligibilityById.get(lap.id);
      if (!result) {
        return [];
      }
      const exclusionReasons = result.runtime.eligible
        ? result.pace.reasons
        : result.runtime.reasons;

      return [
        {
          id: lap.id,
          sourceFileId: lap.sourceFileId,
          sourceFileName: lap.sourceFileName,
          rowNumber: lap.rowNumber,
          driver: lap.driver,
          run: lap.run,
          lapNumber: lap.lapNumber,
          lapTimeUs: lap.lapTimeUs,
          sectorsUs: lap.sectorsUs,
          clean: lap.clean,
          pitIn: lap.pitIn,
          pitOut: lap.pitOut,
          fuelLevel: lap.fuelLevel,
          runtimeEligible: result.runtime.eligible,
          paceEligible: result.pace.eligible,
          runtimeExclusionReasons: [...result.runtime.reasons],
          paceExclusionReasons: [...result.pace.reasons],
          exclusionReason: lap.exclusionReason ?? (exclusionReasons.join(', ') || null),
          stintId: result.stintId,
        },
      ];
    })
    .sort(
      (left, right) =>
        compareText(left.driver, right.driver) ||
        compareText(left.sourceFileName, right.sourceFileName) ||
        left.rowNumber - right.rowNumber ||
        compareText(left.id, right.id),
    );
}

export function buildAnalysisReport(input: BuildAnalysisReportInput): AnalysisReport {
  const workbooks = [...input.workbooks].sort(compareSources);
  const laps = workbooks.flatMap((workbook) => workbook.laps);
  const stints = detectStints(laps);
  const eligibility = deriveLapEligibility(laps, input.selections, stints, input.paceMode);
  const lapAnalyses = driverLapAnalyses(laps, eligibility);
  const sectorEntries = calculateSectorStats(laps, eligibility);
  const sectorBenchmarks = calculateSectorBenchmarks(sectorEntries);
  const sectorGaps = calculateSectorGaps(sectorEntries, sectorBenchmarks);
  const sectorNames = sectorNamesForLaps(laps);
  const sectorAnalyses = buildSectorAnalyses(sectorGaps, sectorBenchmarks, sectorNames);
  const sectorsByName = new Map(sectorAnalyses.map((sector) => [sector.sector, sector]));
  const theoreticalBests = calculateTheoreticalBests(sectorEntries, lapAnalyses, sectorNames);
  const theoreticalByDriver = new Map(
    theoreticalBests.map((analysis) => [analysis.driver, analysis]),
  );
  const drivers: DriverAnalysis[] = lapAnalyses.map((analysis) => {
    const theoretical = theoreticalByDriver.get(analysis.driver);
    const driverSectors: DriverSectorAnalysis[] = sectorGaps
      .filter((entry) => entry.driver === analysis.driver)
      .sort((left, right) => compareText(left.sector, right.sector))
      .map((entry) => ({
        sector: entry.sector,
        medianRank: medianRankForDriver(sectorsByName.get(entry.sector), analysis.driver),
        ...toMetricStats(entry.stats),
        gapToBestSingleUs: entry.gapToBestSingleUs,
        gapToBestMeanUs: entry.gapToBestMeanUs,
        gapToBestMedianUs: entry.gapToBestMedianUs,
      }));

    return {
      driver: analysis.driver,
      runtimeUs: analysis.runtimeUs,
      runtimeLapCount: analysis.runtimeLaps,
      paceLapCount: analysis.paceLaps,
      cleanLapCount: analysis.cleanPercentage.cleanCount,
      eligibleNonPitLapCount: analysis.cleanPercentage.eligibleNonPitCount,
      cleanPercentage: analysis.cleanPercentage.percentage,
      lapStats: toMetricStats(analysis.lapStats),
      theoreticalBestUs: theoretical?.theoreticalBestUs ?? null,
      executionGapUs: theoretical?.executionGapUs ?? null,
      sectors: driverSectors,
      observations: observationsForDriver(
        analysis.driver,
        sectorGaps.filter((entry) => entry.driver === analysis.driver),
        theoretical?.executionGapUs ?? null,
      ),
    };
  });
  const driverByName = new Map(drivers.map((driver) => [driver.driver, driver]));
  const sortedDrivers = drivers
    .filter((driver) => driver.runtimeLapCount > 0)
    .sort(
      (left, right) => left.runtimeUs - right.runtimeUs || compareText(left.driver, right.driver),
    );
  const leaderRuntimeUs = sortedDrivers[0]?.runtimeUs ?? 0;
  const leaderboard = sortedDrivers.map((driver, index) => ({
    position: index + 1,
    driver: driver.driver,
    runtimeUs: driver.runtimeUs,
    gapUs: driver.runtimeUs - leaderRuntimeUs,
    runtimeLapCount: driver.runtimeLapCount,
    paceLapCount: driver.paceLapCount,
    cleanLapCount: driver.cleanLapCount,
    eligibleNonPitLapCount: driver.eligibleNonPitLapCount,
    cleanPercentage: driver.cleanPercentage,
    lapStats: driver.lapStats,
    theoreticalBestUs: driver.theoreticalBestUs,
    executionGapUs: driver.executionGapUs,
  }));

  const progression = calculateStintProgression(laps, eligibility, stints, sectorEntries);
  const stintsById = new Map(stints.map((stint) => [stint.id, stint]));
  const lapsById = new Map(laps.map((lap) => [lap.id, lap]));
  const stintAnalyses: StintAnalysis[] = progression.map((entry) => {
    const stint = stintsById.get(entry.stintId);
    if (!stint) {
      throw new Error(`Stint ${entry.stintId} is missing from the candidate list.`);
    }
    const stintLaps = stint.lapIds.flatMap((lapId) => {
      const lap = lapsById.get(lapId);
      return lap ? [lap] : [];
    });
    const runtimeLaps = runtimeEligibleLaps(stintLaps, eligibility).length;
    const paceLaps = paceEligibleLaps(stintLaps, eligibility).length;

    return {
      stintId: entry.stintId,
      driver: entry.driver,
      sourceFileId: entry.sourceFileId,
      sourceFileName: entry.sourceFileName,
      index: stint.index,
      firstLapId: stint.firstLapId,
      lastLapId: stint.lastLapId,
      outLapId: stint.outLapId,
      inLapId: stint.inLapId,
      lapCount: stint.lapCount,
      fullTimedLapCount: stint.fullTimedLapCount,
      runtimeLapCount: runtimeLaps,
      paceLapCount: paceLaps,
      runtimeUs: runtimeEligibleLaps(stintLaps, eligibility).reduce(
        (total, lap) => total + (lap.lapTimeUs ?? 0),
        0,
      ),
      medianLapUs: entry.medianLapUs,
      progression: entry.laps.map((lap) => ({
        lapId: lap.lapId,
        lapIndex: lap.lapIndex,
        lapNumber: lap.lapNumber,
        lapTimeUs: lap.lapTimeUs,
        deltaToStintMedianUs: lap.deltaToStintMedianUs,
        sectorDeltaUs: lap.sectorDeltaUs,
        fuelLevel: lap.fuelLevel,
      })),
    };
  });

  const sources = workbooks
    .map((workbook) => workbook.source)
    .sort((left, right) => compareText(left.name, right.name) || compareText(left.id, right.id));
  const warnings = analysisWarnings({ workbooks, laps, eligibility, lapAnalyses, sectorGaps });
  const overview = buildOverviewSummary({
    leaderboard,
    sources,
    sectors: sectorAnalyses,
    warnings,
  });
  const consistency = buildConsistencySummaries(sectorAnalyses, drivers);

  const report = {
    schemaVersion: '1.0' as const,
    generatedAt: input.generatedAt,
    configuration: {
      paceMode: input.paceMode,
      benchmarkDefault: 'median' as const,
      scopeSelections: [...input.selections]
        .map((selection) => ({
          scopeKey: selection.scopeKey,
          selectedStintIds: [...selection.selectedStintIds].sort(compareText),
        }))
        .sort((left, right) => compareText(left.scopeKey, right.scopeKey)),
    },
    methodology: methodologyFor(input.paceMode),
    sources,
    warnings,
    overview,
    consistency,
    leaderboard,
    drivers: [...driverByName.values()],
    sectors: sectorAnalyses,
    stints: stintAnalyses,
    lapAudit: buildLapAudit(laps, eligibility),
  };

  // Keep this lookup close to report construction so a missing driver cannot silently pass.
  if (leaderboard.some((row) => !driverByName.has(row.driver))) {
    throw new Error('Every leaderboard driver must have a driver analysis.');
  }
  return analysisReportSchema.parse(report);
}
