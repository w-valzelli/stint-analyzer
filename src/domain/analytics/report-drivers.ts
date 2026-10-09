import type {
  DriverAnalysis,
  DriverSectorAnalysis,
  LeaderboardRow,
  MetricStats,
  SectorAnalysis,
} from '../model/report';
import type { DriverLapAnalysis } from './laps';
import {
  calculateTheoreticalBests,
  type SectorBenchmark,
  type SectorGapEntry,
  type SectorStatsEntry,
} from './sectors';
import type { NullableNumericStats } from './statistics';
import { buildDriverScorecards, medianRankForDriver } from './summaries';
import { compareText } from './text-order';

export type DriverReportInput = {
  lapAnalyses: readonly DriverLapAnalysis[];
  sectorEntries: readonly SectorStatsEntry[];
  sectorBenchmarks: readonly SectorBenchmark[];
  sectorGaps: readonly SectorGapEntry[];
  sectorNames: readonly string[];
};

export type DriverReportSections = {
  sectors: SectorAnalysis[];
  leaderboard: LeaderboardRow[];
  drivers: DriverAnalysis[];
};

type DriverFacts = Omit<DriverAnalysis, 'scorecard'>;

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
  sectorGaps: readonly SectorGapEntry[],
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

function buildSectorAnalyses(
  sectorGaps: readonly SectorGapEntry[],
  benchmarks: readonly SectorBenchmark[],
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

function buildDriverFacts(
  { lapAnalyses, sectorEntries, sectorGaps, sectorNames }: DriverReportInput,
  sectors: readonly SectorAnalysis[],
): DriverFacts[] {
  const sectorsByName = new Map(sectors.map((sector) => [sector.sector, sector]));
  const theoreticalBests = calculateTheoreticalBests(sectorEntries, lapAnalyses, sectorNames);
  const theoreticalByDriver = new Map(
    theoreticalBests.map((analysis) => [analysis.driver, analysis]),
  );

  return lapAnalyses.map((analysis) => {
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
      fuelUsedMeanLiters: analysis.fuelUsedMeanLiters,
      fuelUsedLapCount: analysis.fuelUsedLapCount,
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
}

function buildLeaderboard(driverFacts: readonly DriverFacts[]): LeaderboardRow[] {
  const sortedDrivers = driverFacts
    .filter((driver) => driver.runtimeLapCount > 0)
    .sort(
      (left, right) => left.runtimeUs - right.runtimeUs || compareText(left.driver, right.driver),
    );
  const leaderRuntimeUs = sortedDrivers[0]?.runtimeUs ?? 0;

  return sortedDrivers.map((driver, index) => ({
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
}

function withScorecards(
  driverFacts: readonly DriverFacts[],
  leaderboard: readonly LeaderboardRow[],
): DriverAnalysis[] {
  const scorecards = buildDriverScorecards(
    driverFacts,
    leaderboard.map((row) => row.driver),
  );

  return driverFacts.map((driver) => {
    const scorecard = scorecards.get(driver.driver);
    if (!scorecard) {
      throw new Error(`Driver scorecard ${driver.driver} is missing.`);
    }
    return { ...driver, scorecard };
  });
}

export function buildDriverReportSections(input: DriverReportInput): DriverReportSections {
  const sectors = buildSectorAnalyses(input.sectorGaps, input.sectorBenchmarks, input.sectorNames);
  const driverFacts = buildDriverFacts(input, sectors);
  const leaderboard = buildLeaderboard(driverFacts);
  const drivers = withScorecards(driverFacts, leaderboard);

  return { sectors, leaderboard, drivers };
}
