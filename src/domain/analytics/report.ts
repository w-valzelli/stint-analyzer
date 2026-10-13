import type { ParsedWorkbook } from '../model/normalized';
import { analysisReportSchema, type AnalysisReport } from '../model/report';
import type { PaceMode, ScopeSelection } from '../model/scope';
import { deriveLapEligibility } from './eligibility';
import { driverLapAnalyses } from './laps';
import { buildAuditReportSections } from './report-audit';
import { buildDriverReportSections } from './report-drivers';
import { buildReportWarnings } from './report-warnings';
import {
  calculateSectorBenchmarks,
  calculateSectorGaps,
  calculateSectorStats,
  sectorNamesForLaps,
} from './sectors';
import { detectStints } from './stints';
import { buildConsistencySummaries, buildOverviewSummary } from './summaries';
import { compareText } from './text-order';

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

function compareSources(left: ParsedWorkbook, right: ParsedWorkbook): number {
  return (
    compareText(left.source.name, right.source.name) || compareText(left.source.id, right.source.id)
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

  const sources = workbooks
    .map((workbook) => workbook.source)
    .sort((left, right) => compareText(left.name, right.name) || compareText(left.id, right.id));
  const warnings = buildReportWarnings({ workbooks, laps, eligibility, lapAnalyses, sectorGaps });
  const { sectors, leaderboard, drivers } = buildDriverReportSections({
    lapAnalyses,
    sectorEntries,
    sectorBenchmarks,
    sectorGaps,
    sectorNames,
  });
  const audit = buildAuditReportSections({ laps, eligibility, stints, sectorEntries });
  const overview = buildOverviewSummary({ leaderboard, sources, sectors, warnings });
  const consistency = buildConsistencySummaries(sectors, drivers);

  // Keep this lookup close to report construction so a missing driver cannot silently pass.
  const driverByName = new Map(drivers.map((driver) => [driver.driver, driver]));
  if (leaderboard.some((row) => !driverByName.has(row.driver))) {
    throw new Error('Every leaderboard driver must have a driver analysis.');
  }

  return analysisReportSchema.parse({
    schemaVersion: '1.0',
    generatedAt: input.generatedAt,
    configuration: {
      paceMode: input.paceMode,
      benchmarkDefault: 'median',
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
    sectors,
    stints: audit.stints,
    lapAudit: audit.lapAudit,
  } satisfies AnalysisReport);
}
