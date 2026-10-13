import type { Lap, ParsedWorkbook, ParserWarning } from '../model/normalized';
import type { AnalysisWarning } from '../model/report';
import type { LapEligibility } from '../model/scope';
import { runtimeEligibleLaps, type DriverLapAnalysis } from './laps';
import type { SectorGapEntry } from './sectors';
import { compareText } from './text-order';

export type ReportWarningInput = {
  workbooks: readonly ParsedWorkbook[];
  laps: readonly Lap[];
  eligibility: readonly LapEligibility[];
  lapAnalyses: readonly DriverLapAnalysis[];
  sectorGaps: readonly SectorGapEntry[];
};

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

export function buildReportWarnings({
  workbooks,
  laps,
  eligibility,
  lapAnalyses,
  sectorGaps,
}: ReportWarningInput): AnalysisWarning[] {
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
