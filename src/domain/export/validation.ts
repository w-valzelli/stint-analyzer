import { analysisReportSchema, type AnalysisReport } from '../model/report';

const GAP_TOLERANCE_US = 1;

export class ExportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportValidationError';
  }
}

function assertFinite(value: unknown, path: string): void {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new ExportValidationError(`${path} contains a non-finite number.`);
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertFinite(entry, `${path}[${index}]`));
  } else if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => assertFinite(entry, `${path}.${key}`));
  }
}

export function validateAnalysisReportForExport(reportInput: AnalysisReport): AnalysisReport {
  const result = analysisReportSchema.safeParse(reportInput);
  if (!result.success) {
    throw new ExportValidationError('The analysis report does not match the export schema.');
  }
  const report = result.data;
  assertFinite(report, 'report');

  const drivers = new Set(report.drivers.map((driver) => driver.driver));
  if (report.leaderboard.some((row) => !drivers.has(row.driver))) {
    throw new ExportValidationError('A leaderboard driver is missing from driver analysis.');
  }
  if (report.leaderboard.length > 0 && report.leaderboard[0].gapUs !== 0) {
    throw new ExportValidationError('The leaderboard leader gap must be zero.');
  }

  const sectorNames = report.sectors.map((sector) => sector.sector);
  for (const driver of report.drivers) {
    const driverSectorNames = driver.sectors.map((sector) => sector.sector);
    if (driverSectorNames.some((sector) => !sectorNames.includes(sector))) {
      throw new ExportValidationError(`${driver.driver} has an unknown sector.`);
    }
  }
  for (const sector of report.sectors) {
    for (const driver of sector.drivers) {
      const gaps = [driver.gapToBestSingleUs, driver.gapToBestMeanUs, driver.gapToBestMedianUs];
      if (gaps.some((gap) => gap !== null && gap < -GAP_TOLERANCE_US)) {
        throw new ExportValidationError(`${driver.driver} has a negative ${sector.sector} gap.`);
      }
    }
  }
  if (Object.values(report.methodology).some((entry) => entry.trim().length === 0)) {
    throw new ExportValidationError('Export methodology is incomplete.');
  }

  return report;
}
