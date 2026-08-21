import { z } from 'zod';

import { paceModes } from './scope';

const finiteNumberSchema = z.number().refine(Number.isFinite, 'Expected a finite number');
const nullableFiniteNumberSchema = finiteNumberSchema.nullable();
const nullablePositiveIntegerSchema = z.number().int().positive().nullable();
const nullableNonNegativeIntegerSchema = z.number().int().nonnegative().nullable();

export const analysisConfigSchema = z.object({
  paceMode: z.enum(paceModes),
  benchmarkDefault: z.literal('median'),
  scopeSelections: z.array(
    z.object({
      scopeKey: z.string().min(1),
      selectedStintIds: z.array(z.string().min(1)),
    }),
  ),
});
export type AnalysisConfig = z.infer<typeof analysisConfigSchema>;

export const methodologySchema = z.object({
  runtime: z.string().min(1),
  pace: z.string().min(1),
  cleanPercentage: z.string().min(1),
  standardDeviation: z.string().min(1),
  outliers: z.string().min(1),
  theoreticalBest: z.string().min(1),
  penalties: z.string().min(1),
});
export type Methodology = z.infer<typeof methodologySchema>;

export const analysisWarningSchema = z.object({
  kind: z.enum(['parser', 'analysis']),
  code: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error']),
  message: z.string().min(1),
  sourceFileName: z.string().min(1).nullable(),
  rowNumber: z.number().int().positive().nullable(),
  driver: z.string().min(1).nullable(),
  sector: z.string().min(1).nullable(),
});
export type AnalysisWarning = z.infer<typeof analysisWarningSchema>;

const metricFields = {
  n: z.number().int().nonnegative(),
  bestUs: nullableFiniteNumberSchema,
  meanUs: nullableFiniteNumberSchema,
  medianUs: nullableFiniteNumberSchema,
  sdUs: nullableFiniteNumberSchema,
  madUs: nullableFiniteNumberSchema,
  q1Us: nullableFiniteNumberSchema,
  q3Us: nullableFiniteNumberSchema,
  iqrUs: nullableFiniteNumberSchema,
  rangeUs: nullableFiniteNumberSchema,
  pctWithin100msOfMedian: nullableFiniteNumberSchema,
  pctWithin200msOfMedian: nullableFiniteNumberSchema,
  pctWithin500msOfMedian: nullableFiniteNumberSchema,
  outlierCountIqr: z.number().int().nonnegative(),
};

export const metricStatsSchema = z.object(metricFields);
export type MetricStats = z.infer<typeof metricStatsSchema>;

const sectorGapFields = {
  gapToBestSingleUs: nullableFiniteNumberSchema,
  gapToBestMeanUs: nullableFiniteNumberSchema,
  gapToBestMedianUs: nullableFiniteNumberSchema,
};

export const leaderboardRowSchema = z.object({
  position: z.number().int().positive(),
  driver: z.string().min(1),
  runtimeUs: z.number().int().nonnegative(),
  gapUs: z.number().int().nonnegative(),
  runtimeLapCount: z.number().int().nonnegative(),
  paceLapCount: z.number().int().nonnegative(),
  cleanLapCount: z.number().int().nonnegative(),
  eligibleNonPitLapCount: z.number().int().nonnegative(),
  cleanPercentage: nullableFiniteNumberSchema,
  lapStats: metricStatsSchema,
  theoreticalBestUs: nullableFiniteNumberSchema,
  executionGapUs: nullableFiniteNumberSchema,
});
export type LeaderboardRow = z.infer<typeof leaderboardRowSchema>;

const sectorMetricFields = {
  ...metricFields,
  ...sectorGapFields,
};

export const driverSectorAnalysisSchema = z
  .object({ sector: z.string().min(1) })
  .extend(sectorMetricFields);
export type DriverSectorAnalysis = z.infer<typeof driverSectorAnalysisSchema>;

export const sectorDriverAnalysisSchema = z
  .object({ driver: z.string().min(1) })
  .extend(sectorMetricFields);
export type SectorDriverAnalysis = z.infer<typeof sectorDriverAnalysisSchema>;

export const driverAnalysisSchema = z.object({
  driver: z.string().min(1),
  runtimeUs: z.number().int().nonnegative(),
  runtimeLapCount: z.number().int().nonnegative(),
  paceLapCount: z.number().int().nonnegative(),
  cleanLapCount: z.number().int().nonnegative(),
  eligibleNonPitLapCount: z.number().int().nonnegative(),
  cleanPercentage: nullableFiniteNumberSchema,
  lapStats: metricStatsSchema,
  theoreticalBestUs: nullableFiniteNumberSchema,
  executionGapUs: nullableFiniteNumberSchema,
  sectors: z.array(driverSectorAnalysisSchema),
  observations: z.array(z.string().min(1)),
});
export type DriverAnalysis = z.infer<typeof driverAnalysisSchema>;

export const sectorAnalysisSchema = z.object({
  sector: z.string().min(1),
  benchmark: z.object({
    bestSingleUs: nullableFiniteNumberSchema,
    bestMeanUs: nullableFiniteNumberSchema,
    bestMedianUs: nullableFiniteNumberSchema,
  }),
  drivers: z.array(sectorDriverAnalysisSchema),
});
export type SectorAnalysis = z.infer<typeof sectorAnalysisSchema>;

export const stintProgressionLapSchema = z.object({
  lapId: z.string().min(1),
  lapIndex: z.number().int().positive(),
  lapNumber: nullableNonNegativeIntegerSchema,
  lapTimeUs: z.number().int().positive(),
  deltaToStintMedianUs: finiteNumberSchema,
  sectorDeltaUs: z.record(z.string(), nullableFiniteNumberSchema),
  fuelLevel: nullableFiniteNumberSchema,
});
export type StintProgressionLap = z.infer<typeof stintProgressionLapSchema>;

export const stintAnalysisSchema = z.object({
  stintId: z.string().min(1),
  driver: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourceFileName: z.string().min(1),
  index: z.number().int().nonnegative(),
  firstLapId: z.string().min(1).nullable(),
  lastLapId: z.string().min(1).nullable(),
  outLapId: z.string().min(1).nullable(),
  inLapId: z.string().min(1).nullable(),
  lapCount: z.number().int().nonnegative(),
  fullTimedLapCount: z.number().int().nonnegative(),
  runtimeLapCount: z.number().int().nonnegative(),
  paceLapCount: z.number().int().nonnegative(),
  runtimeUs: z.number().int().nonnegative(),
  medianLapUs: nullableFiniteNumberSchema,
  progression: z.array(stintProgressionLapSchema),
});
export type StintAnalysis = z.infer<typeof stintAnalysisSchema>;

export const lapAuditRowSchema = z.object({
  id: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourceFileName: z.string().min(1),
  rowNumber: z.number().int().positive(),
  driver: z.string().min(1),
  run: z.number().int().nullable(),
  lapNumber: z.number().int().nullable(),
  lapTimeUs: nullablePositiveIntegerSchema,
  sectorsUs: z.record(z.string(), nullablePositiveIntegerSchema),
  clean: z.boolean().nullable(),
  pitIn: z.boolean(),
  pitOut: z.boolean(),
  fuelLevel: nullableFiniteNumberSchema,
  runtimeEligible: z.boolean(),
  paceEligible: z.boolean(),
  runtimeExclusionReasons: z.array(z.string()),
  paceExclusionReasons: z.array(z.string()),
  exclusionReason: z.string().nullable(),
  stintId: z.string().min(1).nullable(),
});
export type LapAuditRow = z.infer<typeof lapAuditRowSchema>;

export const analysisReportSchema = z.object({
  schemaVersion: z.literal('1.0'),
  generatedAt: z.string().min(1),
  configuration: analysisConfigSchema,
  methodology: methodologySchema,
  sources: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      hash: z.string().regex(/^[a-f0-9]{64}$/),
      sheetName: z.string().min(1),
      driverName: z.string().min(1).nullable(),
      trackName: z.string().min(1).nullable(),
      carName: z.string().min(1).nullable(),
      driverNames: z.array(z.string()),
      sectorNames: z.array(z.string()),
      timedLapCount: z.number().int().nonnegative(),
      fullTimedLapCount: z.number().int().nonnegative(),
      partialLapCount: z.number().int().nonnegative(),
      warningCount: z.number().int().nonnegative(),
    }),
  ),
  warnings: z.array(analysisWarningSchema),
  leaderboard: z.array(leaderboardRowSchema),
  drivers: z.array(driverAnalysisSchema),
  sectors: z.array(sectorAnalysisSchema),
  stints: z.array(stintAnalysisSchema),
  lapAudit: z.array(lapAuditRowSchema),
});
export type AnalysisReport = z.infer<typeof analysisReportSchema>;
