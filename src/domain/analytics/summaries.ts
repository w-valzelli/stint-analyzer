import type {
  AnalysisWarning,
  ConsistencyMetricSummary,
  ConsistencySummary,
  DriverAnalysis,
  DriverScorecard,
  LeaderboardRow,
  MetricStats,
  OverviewSummary,
  ScorecardMetric,
  SectorAnalysis,
} from '../model/report';
import type { SourceSummary } from '../model/normalized';
import { durationStats } from './statistics';

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function minimum(values: readonly (number | null)[]): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length === 0 ? null : Math.min(...available);
}

function metricEntries(
  sectors: readonly SectorAnalysis[],
  driver: string,
  metric: 'sdUs' | 'madUs' | 'iqrUs' | 'rangeUs',
): { sector: string; value: number }[] {
  return sectors
    .map((sector) => ({
      sector: sector.sector,
      value: sector.drivers.find((entry) => entry.driver === driver)?.[metric] ?? null,
    }))
    .filter((entry): entry is { sector: string; value: number } => entry.value !== null)
    .sort((left, right) => left.value - right.value || compareText(left.sector, right.sector));
}

function consistencyMetricSummary(
  sectors: readonly SectorAnalysis[],
  driver: string,
  metric: 'sdUs' | 'madUs' | 'iqrUs' | 'rangeUs',
): ConsistencyMetricSummary {
  const entries = metricEntries(sectors, driver, metric);
  const stats = durationStats(entries.map((entry) => entry.value));

  return {
    meanUs: stats.mean,
    mostConsistentSector: entries[0]?.sector ?? null,
    leastConsistentSector: entries.at(-1)?.sector ?? null,
  };
}

export function medianRankForDriver(
  sector: SectorAnalysis | undefined,
  driver: string,
): number | null {
  if (!sector) {
    return null;
  }
  const target = sector.drivers.find((entry) => entry.driver === driver);
  const targetGap = target?.gapToBestMedianUs ?? null;
  if (targetGap === null) {
    return null;
  }
  const fasterCount = sector.drivers.filter(
    (entry) => entry.gapToBestMedianUs !== null && entry.gapToBestMedianUs < targetGap,
  ).length;
  return fasterCount + 1;
}

export function buildOverviewSummary(input: {
  leaderboard: readonly LeaderboardRow[];
  sources: readonly SourceSummary[];
  sectors: readonly SectorAnalysis[];
  warnings: readonly AnalysisWarning[];
}): OverviewSummary {
  return {
    driverCount: input.leaderboard.length,
    sourceFileCount: input.sources.length,
    runtimeLapCount: input.leaderboard.reduce((total, row) => total + row.runtimeLapCount, 0),
    paceLapCount: input.leaderboard.reduce((total, row) => total + row.paceLapCount, 0),
    fastestBestUs: minimum(input.leaderboard.map((row) => row.lapStats.bestUs)),
    fastestMedianUs: minimum(input.leaderboard.map((row) => row.lapStats.medianUs)),
    warningCount: input.warnings.length,
    sectorLeaders: input.sectors.map((sector) => {
      const bestMedianUs = sector.benchmark.bestMedianUs;
      return {
        sector: sector.sector,
        bestMedianUs,
        drivers:
          bestMedianUs === null
            ? []
            : sector.drivers
                .flatMap((entry) => (entry.medianUs === bestMedianUs ? [entry.driver] : []))
                .sort(compareText),
      };
    }),
  };
}

export function buildConsistencySummaries(
  sectors: readonly SectorAnalysis[],
  drivers: readonly DriverAnalysis[],
): ConsistencySummary[] {
  return drivers.map((driver) => ({
    driver: driver.driver,
    sd: consistencyMetricSummary(sectors, driver.driver, 'sdUs'),
    mad: consistencyMetricSummary(sectors, driver.driver, 'madUs'),
    iqr: consistencyMetricSummary(sectors, driver.driver, 'iqrUs'),
    range: consistencyMetricSummary(sectors, driver.driver, 'rangeUs'),
    iqrOutlierCount: driver.sectors.reduce((total, sector) => total + sector.outlierCountIqr, 0),
  }));
}

export type ScorecardDriverInput = {
  driver: string;
  lapStats: Pick<MetricStats, 'n' | 'medianUs' | 'madUs'>;
  cleanPercentage: number | null;
  cleanLapCount: number;
  eligibleNonPitLapCount: number;
  fuelUsedMeanLiters: number | null;
  fuelUsedLapCount: number;
  executionGapUs: number | null;
};

type ScorecardRankDirection = 'lower-first' | 'higher-first';

type ScorecardMetricDefinition = {
  valueFor: (driver: ScorecardDriverInput) => number | null;
  sampleSizeFor: (driver: ScorecardDriverInput) => number;
  direction: ScorecardRankDirection;
};

const scorecardMetricDefinitions = {
  pace: {
    valueFor: (driver) => driver.lapStats.medianUs,
    sampleSizeFor: (driver) => driver.lapStats.n,
    direction: 'lower-first',
  },
  potential: {
    valueFor: (driver) => driver.executionGapUs,
    sampleSizeFor: (driver) => driver.lapStats.n,
    direction: 'higher-first',
  },
  efficiency: {
    valueFor: (driver) => driver.fuelUsedMeanLiters,
    sampleSizeFor: (driver) => driver.fuelUsedLapCount,
    direction: 'lower-first',
  },
  cleanliness: {
    valueFor: (driver) => driver.cleanPercentage,
    sampleSizeFor: (driver) => driver.eligibleNonPitLapCount,
    direction: 'higher-first',
  },
  consistency: {
    valueFor: (driver) => driver.lapStats.madUs,
    sampleSizeFor: (driver) => driver.lapStats.n,
    direction: 'lower-first',
  },
} satisfies Record<keyof DriverScorecard, ScorecardMetricDefinition>;

function buildScorecardMetric(
  driver: ScorecardDriverInput,
  drivers: readonly ScorecardDriverInput[],
  leaderboardDrivers: ReadonlySet<string>,
  leaderboardDriverCount: number,
  definition: ScorecardMetricDefinition,
): ScorecardMetric {
  const available = drivers.flatMap((entry) => {
    const value = definition.valueFor(entry);
    return leaderboardDrivers.has(entry.driver) && value !== null ? [{ value }] : [];
  });
  const value = definition.valueFor(driver);
  const rank =
    !leaderboardDrivers.has(driver.driver) || value === null
      ? null
      : available.filter((entry) =>
          definition.direction === 'lower-first' ? entry.value < value : entry.value > value,
        ).length + 1;
  const fieldSize = available.length;

  return {
    rank,
    fieldSize,
    radarScore: rank === null ? null : leaderboardDriverCount - rank + 1,
    sampleSize: definition.sampleSizeFor(driver),
  };
}

export function buildDriverScorecards(
  drivers: readonly ScorecardDriverInput[],
  leaderboardDrivers: readonly string[],
): Map<string, DriverScorecard> {
  const leaderboardDriverSet = new Set(leaderboardDrivers);

  return new Map(
    drivers.map((driver) => {
      const metric = (definition: ScorecardMetricDefinition) =>
        buildScorecardMetric(
          driver,
          drivers,
          leaderboardDriverSet,
          leaderboardDrivers.length,
          definition,
        );

      return [
        driver.driver,
        {
          pace: metric(scorecardMetricDefinitions.pace),
          potential: metric(scorecardMetricDefinitions.potential),
          efficiency: metric(scorecardMetricDefinitions.efficiency),
          cleanliness: metric(scorecardMetricDefinitions.cleanliness),
          consistency: metric(scorecardMetricDefinitions.consistency),
        },
      ];
    }),
  );
}
