import { z } from 'zod';

import { paceModes } from '../model/scope';

// JSON 1.0 contract. Object key order is the serialized key order.

const finiteNumberSchema = z.number().refine(Number.isFinite, 'Expected a finite number');
const nullableFiniteNumberSchema = finiteNumberSchema.nullable();
const countSchema = z.number().int().nonnegative();
const nullableTextSchema = z.string().min(1).nullable();

// Sector keys are lowercased and their values stay in microseconds.
const sectorMicrosecondsSchema = z.record(z.string(), nullableFiniteNumberSchema);

const selectedStintSchema = z.object({
  driver: z.string().min(1),
  source_file_name: z.string().min(1),
  stint_index: countSchema,
});

const configurationSchema = z.object({
  pace_mode: z.enum(paceModes),
  benchmark_default: z.literal('median'),
  selected_stints: z.array(selectedStintSchema),
});
export type SerializedConfiguration = z.infer<typeof configurationSchema>;

const methodologySchema = z.object({
  runtime: z.string().min(1),
  pace: z.string().min(1),
  clean_percentage: z.string().min(1),
  standard_deviation: z.string().min(1),
  outliers: z.string().min(1),
  theoretical_best: z.string().min(1),
  penalties: z.string().min(1),
});
export type SerializedMethodology = z.infer<typeof methodologySchema>;

const sourceSchema = z.object({
  name: z.string().min(1),
  sheet_name: z.string().min(1),
  driver_name: nullableTextSchema,
  track_name: nullableTextSchema,
  car_name: nullableTextSchema,
  driver_names: z.array(z.string()),
  sector_names: z.array(z.string()),
  timed_lap_count: countSchema,
  full_timed_lap_count: countSchema,
  partial_lap_count: countSchema,
  warning_count: countSchema,
});
export type SerializedSource = z.infer<typeof sourceSchema>;

const warningSchema = z.object({
  kind: z.enum(['parser', 'analysis']),
  code: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error']),
  message: z.string().min(1),
  source_file_name: z.string().min(1),
  row_number: z.number().int().positive().nullable(),
  driver: nullableTextSchema,
  sector: nullableTextSchema,
});
export type SerializedWarning = z.infer<typeof warningSchema>;

const sectorLeaderSchema = z.object({
  sector: z.string().min(1),
  drivers: z.array(z.string().min(1)),
  best_median_seconds: nullableFiniteNumberSchema,
});

const overviewSchema = z.object({
  driver_count: countSchema,
  source_file_count: countSchema,
  runtime_lap_count: countSchema,
  pace_lap_count: countSchema,
  fastest_best_seconds: nullableFiniteNumberSchema,
  fastest_median_seconds: nullableFiniteNumberSchema,
  warning_count: countSchema,
  sector_leaders: z.array(sectorLeaderSchema),
});
export type SerializedOverview = z.infer<typeof overviewSchema>;

const consistencyMetricSchema = z.object({
  mean_seconds: nullableFiniteNumberSchema,
  most_consistent_sector: nullableTextSchema,
  least_consistent_sector: nullableTextSchema,
});
export type SerializedConsistencyMetric = z.infer<typeof consistencyMetricSchema>;

const consistencySchema = z.object({
  driver: z.string().min(1),
  sd: consistencyMetricSchema,
  mad: consistencyMetricSchema,
  iqr: consistencyMetricSchema,
  range: consistencyMetricSchema,
  iqr_outlier_count: countSchema,
});
export type SerializedConsistency = z.infer<typeof consistencySchema>;

const lapStatsFields = {
  n: countSchema,
  best_seconds: nullableFiniteNumberSchema,
  worst_seconds: nullableFiniteNumberSchema,
  mean_seconds: nullableFiniteNumberSchema,
  median_seconds: nullableFiniteNumberSchema,
  sd_seconds: nullableFiniteNumberSchema,
  mad_seconds: nullableFiniteNumberSchema,
  q1_seconds: nullableFiniteNumberSchema,
  q3_seconds: nullableFiniteNumberSchema,
  iqr_seconds: nullableFiniteNumberSchema,
  range_seconds: nullableFiniteNumberSchema,
  pct_within100ms_of_median: nullableFiniteNumberSchema,
  pct_within200ms_of_median: nullableFiniteNumberSchema,
  pct_within500ms_of_median: nullableFiniteNumberSchema,
  outlier_count_iqr: countSchema,
};

const lapStatsSchema = z.object(lapStatsFields);
export type SerializedLapStats = z.infer<typeof lapStatsSchema>;

const sectorGapFields = {
  gap_to_best_single_seconds: nullableFiniteNumberSchema,
  gap_to_best_mean_seconds: nullableFiniteNumberSchema,
  gap_to_best_median_seconds: nullableFiniteNumberSchema,
};

const leaderboardRowSchema = z.object({
  position: z.number().int().positive(),
  driver: z.string().min(1),
  runtime_seconds: finiteNumberSchema,
  gap_seconds: finiteNumberSchema,
  runtime_lap_count: countSchema,
  pace_lap_count: countSchema,
  clean_lap_count: countSchema,
  eligible_non_pit_lap_count: countSchema,
  clean_percentage: nullableFiniteNumberSchema,
  lap_stats: lapStatsSchema,
  theoretical_best_seconds: nullableFiniteNumberSchema,
  execution_gap_seconds: nullableFiniteNumberSchema,
});
export type SerializedLeaderboardRow = z.infer<typeof leaderboardRowSchema>;

const driverSectorSchema = z.object({
  sector: z.string().min(1),
  median_rank: z.number().int().positive().nullable(),
  ...lapStatsFields,
  ...sectorGapFields,
});
export type SerializedDriverSector = z.infer<typeof driverSectorSchema>;

const scorecardMetricSchema = z.object({
  rank: z.number().int().positive().nullable(),
  field_size: countSchema,
  radar_score: nullableFiniteNumberSchema,
  sample_size: countSchema,
});
export type SerializedScorecardMetric = z.infer<typeof scorecardMetricSchema>;

const scorecardSchema = z.object({
  pace: scorecardMetricSchema,
  potential: scorecardMetricSchema,
  efficiency: scorecardMetricSchema,
  cleanliness: scorecardMetricSchema,
  consistency: scorecardMetricSchema,
});
export type SerializedScorecard = z.infer<typeof scorecardSchema>;

const driverSchema = z.object({
  driver: z.string().min(1),
  runtime_seconds: finiteNumberSchema,
  runtime_lap_count: countSchema,
  pace_lap_count: countSchema,
  clean_lap_count: countSchema,
  eligible_non_pit_lap_count: countSchema,
  clean_percentage: nullableFiniteNumberSchema,
  lap_stats: lapStatsSchema,
  fuel_used_mean_liters: nullableFiniteNumberSchema,
  fuel_used_lap_count: countSchema,
  theoretical_best_seconds: nullableFiniteNumberSchema,
  execution_gap_seconds: nullableFiniteNumberSchema,
  sectors: z.array(driverSectorSchema),
  observations: z.array(z.string().min(1)),
  scorecard: scorecardSchema,
});
export type SerializedDriver = z.infer<typeof driverSchema>;

const sectorDriverSchema = z.object({
  driver: z.string().min(1),
  ...lapStatsFields,
  ...sectorGapFields,
});
export type SerializedSectorDriver = z.infer<typeof sectorDriverSchema>;

const sectorSchema = z.object({
  sector: z.string().min(1),
  benchmark: z.object({
    best_single_seconds: nullableFiniteNumberSchema,
    best_mean_seconds: nullableFiniteNumberSchema,
    best_median_seconds: nullableFiniteNumberSchema,
  }),
  drivers: z.array(sectorDriverSchema),
});
export type SerializedSector = z.infer<typeof sectorSchema>;

const stintProgressionLapSchema = z.object({
  lap_index: z.number().int().positive(),
  lap_number: z.number().int().nonnegative().nullable(),
  lap_time_seconds: finiteNumberSchema,
  delta_to_stint_median_seconds: finiteNumberSchema,
  sector_delta_seconds: sectorMicrosecondsSchema,
  fuel_level: nullableFiniteNumberSchema,
});
export type SerializedStintProgressionLap = z.infer<typeof stintProgressionLapSchema>;

const stintSchema = z.object({
  driver: z.string().min(1),
  source_file_name: z.string().min(1),
  index: countSchema,
  lap_count: countSchema,
  full_timed_lap_count: countSchema,
  runtime_lap_count: countSchema,
  pace_lap_count: countSchema,
  runtime_seconds: finiteNumberSchema,
  median_lap_seconds: nullableFiniteNumberSchema,
  progression: z.array(stintProgressionLapSchema),
});
export type SerializedStint = z.infer<typeof stintSchema>;

const lapAuditRowSchema = z.object({
  source_file_name: z.string().min(1),
  row_number: z.number().int().positive(),
  driver: z.string().min(1),
  run: z.number().int().nullable(),
  lap_number: z.number().int().nullable(),
  lap_time_seconds: nullableFiniteNumberSchema,
  sectors_seconds: sectorMicrosecondsSchema,
  clean: z.boolean().nullable(),
  pit_in: z.boolean(),
  pit_out: z.boolean(),
  fuel_level: nullableFiniteNumberSchema,
  runtime_eligible: z.boolean(),
  pace_eligible: z.boolean(),
  runtime_exclusion_reasons: z.array(z.string()),
  pace_exclusion_reasons: z.array(z.string()),
  exclusion_reason: z.string().nullable(),
});
export type SerializedLapAuditRow = z.infer<typeof lapAuditRowSchema>;

export const serializedAnalysisReportSchema = z.object({
  schema_version: z.literal('1.0'),
  report_type: z.literal('garage61-stint-analysis'),
  generated_at: z.string().min(1),
  configuration: configurationSchema,
  methodology: methodologySchema,
  sources: z.array(sourceSchema),
  warnings: z.array(warningSchema),
  overview: overviewSchema,
  consistency: z.array(consistencySchema),
  leaderboard: z.array(leaderboardRowSchema),
  drivers: z.array(driverSchema),
  sectors: z.array(sectorSchema),
  stints: z.array(stintSchema),
  lap_audit: z.array(lapAuditRowSchema),
});
export type SerializedAnalysisReport = z.infer<typeof serializedAnalysisReportSchema>;
