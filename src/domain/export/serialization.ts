import {
  analysisReportSchema,
  type AnalysisConfig,
  type AnalysisReport,
  type AnalysisWarning,
  type ConsistencyMetricSummary,
  type ConsistencySummary,
  type DriverAnalysis,
  type DriverScorecard,
  type DriverSectorAnalysis,
  type LapAuditRow,
  type LeaderboardRow,
  type Methodology,
  type MetricStats,
  type OverviewSummary,
  type ScorecardMetric,
  type SectorAnalysis,
  type SectorDriverAnalysis,
  type StintAnalysis,
  type StintProgressionLap,
} from '../model/report';
import type { SourceSummary } from '../model/normalized';
import {
  serializedAnalysisReportSchema,
  type SerializedAnalysisReport,
  type SerializedConfiguration,
  type SerializedConsistency,
  type SerializedConsistencyMetric,
  type SerializedDriver,
  type SerializedDriverSector,
  type SerializedLapAuditRow,
  type SerializedLapStats,
  type SerializedLeaderboardRow,
  type SerializedMethodology,
  type SerializedOverview,
  type SerializedScorecard,
  type SerializedScorecardMetric,
  type SerializedSector,
  type SerializedSectorDriver,
  type SerializedSource,
  type SerializedStint,
  type SerializedStintProgressionLap,
  type SerializedWarning,
} from './serialized-report';

export { serializedAnalysisReportSchema, type SerializedAnalysisReport };

type SerializedSectorGaps = Pick<
  SerializedSectorDriver,
  'gap_to_best_single_seconds' | 'gap_to_best_mean_seconds' | 'gap_to_best_median_seconds'
>;

type SectorGaps = Pick<
  SectorDriverAnalysis,
  'gapToBestSingleUs' | 'gapToBestMeanUs' | 'gapToBestMedianUs'
>;

export function sourceBasename(value: string): string {
  return value.split(/[\\/]/).at(-1) ?? value;
}

function seconds(microseconds: number): number;
function seconds(microseconds: number | null): number | null;
function seconds(microseconds: number | null): number | null {
  return microseconds === null ? null : microseconds / 1_000_000;
}

// JSON 1.0 lowercases sector keys and keeps their values in microseconds.
function sectorMicroseconds(values: Record<string, number | null>): Record<string, number | null> {
  return Object.fromEntries(
    Object.entries(values).map(([sector, value]) => [sector.toLowerCase(), value]),
  );
}

function serializeConfiguration(
  configuration: AnalysisConfig,
  stints: readonly StintAnalysis[],
): SerializedConfiguration {
  return {
    pace_mode: configuration.paceMode,
    benchmark_default: configuration.benchmarkDefault,
    selected_stints: stints
      .filter((stint) => stint.runtimeLapCount > 0)
      .map((stint) => ({
        driver: stint.driver,
        source_file_name: sourceBasename(stint.sourceFileName),
        stint_index: stint.index,
      })),
  };
}

function serializeMethodology(methodology: Methodology): SerializedMethodology {
  return {
    runtime: methodology.runtime,
    pace: methodology.pace,
    clean_percentage: methodology.cleanPercentage,
    standard_deviation: methodology.standardDeviation,
    outliers: methodology.outliers,
    theoretical_best: methodology.theoreticalBest,
    penalties: methodology.penalties,
  };
}

function serializeSource(source: SourceSummary): SerializedSource {
  return {
    name: sourceBasename(source.name),
    sheet_name: source.sheetName,
    driver_name: source.driverName,
    track_name: source.trackName,
    car_name: source.carName,
    driver_names: source.driverNames,
    sector_names: source.sectorNames,
    timed_lap_count: source.timedLapCount,
    full_timed_lap_count: source.fullTimedLapCount,
    partial_lap_count: source.partialLapCount,
    warning_count: source.warningCount,
  };
}

function serializeWarning(warning: AnalysisWarning): SerializedWarning {
  return {
    kind: warning.kind,
    code: warning.code,
    severity: warning.severity,
    message: warning.message,
    // JSON 1.0 writes a missing source file name as the string 'null'.
    source_file_name: sourceBasename(String(warning.sourceFileName)),
    row_number: warning.rowNumber,
    driver: warning.driver,
    sector: warning.sector,
  };
}

function serializeOverview(overview: OverviewSummary): SerializedOverview {
  return {
    driver_count: overview.driverCount,
    source_file_count: overview.sourceFileCount,
    runtime_lap_count: overview.runtimeLapCount,
    pace_lap_count: overview.paceLapCount,
    fastest_best_seconds: seconds(overview.fastestBestUs),
    fastest_median_seconds: seconds(overview.fastestMedianUs),
    warning_count: overview.warningCount,
    sector_leaders: overview.sectorLeaders.map((leader) => ({
      sector: leader.sector,
      drivers: leader.drivers,
      best_median_seconds: seconds(leader.bestMedianUs),
    })),
  };
}

function serializeConsistencyMetric(metric: ConsistencyMetricSummary): SerializedConsistencyMetric {
  return {
    mean_seconds: seconds(metric.meanUs),
    most_consistent_sector: metric.mostConsistentSector,
    least_consistent_sector: metric.leastConsistentSector,
  };
}

function serializeConsistency(summary: ConsistencySummary): SerializedConsistency {
  return {
    driver: summary.driver,
    sd: serializeConsistencyMetric(summary.sd),
    mad: serializeConsistencyMetric(summary.mad),
    iqr: serializeConsistencyMetric(summary.iqr),
    range: serializeConsistencyMetric(summary.range),
    iqr_outlier_count: summary.iqrOutlierCount,
  };
}

function serializeLapStats(stats: MetricStats): SerializedLapStats {
  return {
    n: stats.n,
    best_seconds: seconds(stats.bestUs),
    worst_seconds: seconds(stats.worstUs),
    mean_seconds: seconds(stats.meanUs),
    median_seconds: seconds(stats.medianUs),
    sd_seconds: seconds(stats.sdUs),
    mad_seconds: seconds(stats.madUs),
    q1_seconds: seconds(stats.q1Us),
    q3_seconds: seconds(stats.q3Us),
    iqr_seconds: seconds(stats.iqrUs),
    range_seconds: seconds(stats.rangeUs),
    pct_within100ms_of_median: stats.pctWithin100msOfMedian,
    pct_within200ms_of_median: stats.pctWithin200msOfMedian,
    pct_within500ms_of_median: stats.pctWithin500msOfMedian,
    outlier_count_iqr: stats.outlierCountIqr,
  };
}

function serializeSectorGaps(gaps: SectorGaps): SerializedSectorGaps {
  return {
    gap_to_best_single_seconds: seconds(gaps.gapToBestSingleUs),
    gap_to_best_mean_seconds: seconds(gaps.gapToBestMeanUs),
    gap_to_best_median_seconds: seconds(gaps.gapToBestMedianUs),
  };
}

function serializeLeaderboardRow(row: LeaderboardRow): SerializedLeaderboardRow {
  return {
    position: row.position,
    driver: row.driver,
    runtime_seconds: seconds(row.runtimeUs),
    gap_seconds: seconds(row.gapUs),
    runtime_lap_count: row.runtimeLapCount,
    pace_lap_count: row.paceLapCount,
    clean_lap_count: row.cleanLapCount,
    eligible_non_pit_lap_count: row.eligibleNonPitLapCount,
    clean_percentage: row.cleanPercentage,
    lap_stats: serializeLapStats(row.lapStats),
    theoretical_best_seconds: seconds(row.theoreticalBestUs),
    execution_gap_seconds: seconds(row.executionGapUs),
  };
}

function serializeDriverSector(sector: DriverSectorAnalysis): SerializedDriverSector {
  return {
    sector: sector.sector,
    median_rank: sector.medianRank,
    ...serializeLapStats(sector),
    ...serializeSectorGaps(sector),
  };
}

function serializeScorecardMetric(metric: ScorecardMetric): SerializedScorecardMetric {
  return {
    rank: metric.rank,
    field_size: metric.fieldSize,
    radar_score: metric.radarScore,
    sample_size: metric.sampleSize,
  };
}

function serializeScorecard(scorecard: DriverScorecard): SerializedScorecard {
  return {
    pace: serializeScorecardMetric(scorecard.pace),
    potential: serializeScorecardMetric(scorecard.potential),
    efficiency: serializeScorecardMetric(scorecard.efficiency),
    cleanliness: serializeScorecardMetric(scorecard.cleanliness),
    consistency: serializeScorecardMetric(scorecard.consistency),
  };
}

function serializeDriver(driver: DriverAnalysis): SerializedDriver {
  return {
    driver: driver.driver,
    runtime_seconds: seconds(driver.runtimeUs),
    runtime_lap_count: driver.runtimeLapCount,
    pace_lap_count: driver.paceLapCount,
    clean_lap_count: driver.cleanLapCount,
    eligible_non_pit_lap_count: driver.eligibleNonPitLapCount,
    clean_percentage: driver.cleanPercentage,
    lap_stats: serializeLapStats(driver.lapStats),
    fuel_used_mean_liters: driver.fuelUsedMeanLiters,
    fuel_used_lap_count: driver.fuelUsedLapCount,
    theoretical_best_seconds: seconds(driver.theoreticalBestUs),
    execution_gap_seconds: seconds(driver.executionGapUs),
    sectors: driver.sectors.map(serializeDriverSector),
    observations: driver.observations,
    scorecard: serializeScorecard(driver.scorecard),
  };
}

function serializeSectorDriver(driver: SectorDriverAnalysis): SerializedSectorDriver {
  return {
    driver: driver.driver,
    ...serializeLapStats(driver),
    ...serializeSectorGaps(driver),
  };
}

function serializeSector(sector: SectorAnalysis): SerializedSector {
  return {
    sector: sector.sector,
    benchmark: {
      best_single_seconds: seconds(sector.benchmark.bestSingleUs),
      best_mean_seconds: seconds(sector.benchmark.bestMeanUs),
      best_median_seconds: seconds(sector.benchmark.bestMedianUs),
    },
    drivers: sector.drivers.map(serializeSectorDriver),
  };
}

function serializeStintProgressionLap(lap: StintProgressionLap): SerializedStintProgressionLap {
  return {
    lap_index: lap.lapIndex,
    lap_number: lap.lapNumber,
    lap_time_seconds: seconds(lap.lapTimeUs),
    delta_to_stint_median_seconds: seconds(lap.deltaToStintMedianUs),
    sector_delta_seconds: sectorMicroseconds(lap.sectorDeltaUs),
    fuel_level: lap.fuelLevel,
  };
}

function serializeStint(stint: StintAnalysis): SerializedStint {
  return {
    driver: stint.driver,
    source_file_name: sourceBasename(stint.sourceFileName),
    index: stint.index,
    lap_count: stint.lapCount,
    full_timed_lap_count: stint.fullTimedLapCount,
    runtime_lap_count: stint.runtimeLapCount,
    pace_lap_count: stint.paceLapCount,
    runtime_seconds: seconds(stint.runtimeUs),
    median_lap_seconds: seconds(stint.medianLapUs),
    progression: stint.progression.map(serializeStintProgressionLap),
  };
}

function serializeLapAuditRow(lap: LapAuditRow): SerializedLapAuditRow {
  return {
    source_file_name: sourceBasename(lap.sourceFileName),
    row_number: lap.rowNumber,
    driver: lap.driver,
    run: lap.run,
    lap_number: lap.lapNumber,
    lap_time_seconds: seconds(lap.lapTimeUs),
    sectors_seconds: sectorMicroseconds(lap.sectorsUs),
    clean: lap.clean,
    pit_in: lap.pitIn,
    pit_out: lap.pitOut,
    fuel_level: lap.fuelLevel,
    runtime_eligible: lap.runtimeEligible,
    pace_eligible: lap.paceEligible,
    runtime_exclusion_reasons: lap.runtimeExclusionReasons,
    pace_exclusion_reasons: lap.paceExclusionReasons,
    exclusion_reason: lap.exclusionReason,
  };
}

export function serializeAnalysisReport(reportInput: AnalysisReport): SerializedAnalysisReport {
  const report = analysisReportSchema.parse(reportInput);

  return serializedAnalysisReportSchema.parse({
    schema_version: report.schemaVersion,
    report_type: 'garage61-stint-analysis',
    generated_at: report.generatedAt,
    configuration: serializeConfiguration(report.configuration, report.stints),
    methodology: serializeMethodology(report.methodology),
    sources: report.sources.map(serializeSource),
    warnings: report.warnings.map(serializeWarning),
    overview: serializeOverview(report.overview),
    consistency: report.consistency.map(serializeConsistency),
    leaderboard: report.leaderboard.map(serializeLeaderboardRow),
    drivers: report.drivers.map(serializeDriver),
    sectors: report.sectors.map(serializeSector),
    stints: report.stints.map(serializeStint),
    lap_audit: report.lapAudit.map(serializeLapAuditRow),
  } satisfies SerializedAnalysisReport);
}

export function compactAnalysisData(report: AnalysisReport) {
  const serialized = serializeAnalysisReport(report);
  return {
    schema_version: serialized.schema_version,
    report_type: serialized.report_type,
    generated_at: serialized.generated_at,
    configuration: serialized.configuration,
    methodology: serialized.methodology,
    warnings: serialized.warnings,
    leaderboard: serialized.leaderboard,
    drivers: serialized.drivers,
    sectors: serialized.sectors,
  };
}
