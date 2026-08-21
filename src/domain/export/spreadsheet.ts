import writeXlsxFile, { type Cell, type SheetData } from 'write-excel-file/universal';

import type { AnalysisReport } from '../model/report';
import { formatDurationUs, microsecondsToSeconds, sourceBasename } from './serialization';
import { validateAnalysisReportForExport } from './validation';

export const spreadsheetSheetNames = [
  'Overview',
  'Leaderboard',
  'Sector Summary',
  'Sector Matrix Median',
  'Sector Matrix Average',
  'Best Sectors',
  'Stints',
  'Lap Audit',
  'Methodology',
] as const;

const headerStyle = {
  fontWeight: 'bold' as const,
  backgroundColor: '#E8E5DC',
  textColor: '#182126',
};

function header(values: readonly string[]): Cell[] {
  return values.map((value) => ({ value, ...headerStyle }));
}

function durationCell(valueUs: number | null): Cell {
  const value = microsecondsToSeconds(valueUs);
  return value === null ? null : { value, format: '0.000000' };
}

function percentageCell(value: number | null): Cell {
  return value === null ? null : { value: value / 100, format: '0.0%' };
}

function sheet(sheetName: (typeof spreadsheetSheetNames)[number], data: SheetData) {
  const columnCount = Math.max(1, ...data.map((row) => row.length));
  return {
    sheet: sheetName,
    data,
    columns: Array.from({ length: columnCount }, () => ({ width: 18 })),
    stickyRowsCount: 1,
  };
}

function overviewSheet(report: AnalysisReport): SheetData {
  return [
    header(['Stint Analyzer report', 'Value']),
    ['Generated at', report.generatedAt],
    ['Schema version', report.schemaVersion],
    ['Pace mode', report.configuration.paceMode],
    ['Default benchmark', report.configuration.benchmarkDefault],
    ['Source files', report.overview.sourceFileCount],
    ['Drivers', report.overview.driverCount],
    ['Selected runtime laps', report.overview.runtimeLapCount],
    ['Eligible pace laps', report.overview.paceLapCount],
    ['Fastest best lap seconds', durationCell(report.overview.fastestBestUs)],
    ['Fastest best lap', formatDurationUs(report.overview.fastestBestUs)],
    ['Fastest median lap seconds', durationCell(report.overview.fastestMedianUs)],
    ['Fastest median lap', formatDurationUs(report.overview.fastestMedianUs)],
    ['Warnings', report.overview.warningCount],
  ];
}

function leaderboardSheet(report: AnalysisReport): SheetData {
  return [
    header([
      'Position',
      'Driver',
      'Runtime Seconds',
      'Runtime',
      'Gap Seconds',
      'Gap',
      'Runtime Laps',
      'Pace Laps',
      'Clean Laps',
      'Eligible Non-Pit Laps',
      'Clean %',
      'Best Lap Seconds',
      'Mean Lap Seconds',
      'Median Lap Seconds',
      'Lap SD Seconds',
      'Theoretical Best Seconds',
      'Execution Gap Seconds',
    ]),
    ...report.leaderboard.map((row) => [
      row.position,
      row.driver,
      durationCell(row.runtimeUs),
      formatDurationUs(row.runtimeUs),
      durationCell(row.gapUs),
      formatDurationUs(row.gapUs),
      row.runtimeLapCount,
      row.paceLapCount,
      row.cleanLapCount,
      row.eligibleNonPitLapCount,
      percentageCell(row.cleanPercentage),
      durationCell(row.lapStats.bestUs),
      durationCell(row.lapStats.meanUs),
      durationCell(row.lapStats.medianUs),
      durationCell(row.lapStats.sdUs),
      durationCell(row.theoreticalBestUs),
      durationCell(row.executionGapUs),
    ]),
  ];
}

function sectorSummarySheet(report: AnalysisReport): SheetData {
  return [
    header([
      'Driver',
      'Sector',
      'N',
      'Best Seconds',
      'Mean Seconds',
      'Median Seconds',
      'SD Seconds',
      'MAD Seconds',
      'IQR Seconds',
      'Range Seconds',
      'Gap to Best Mean Seconds',
      'Gap to Best Median Seconds',
      'Gap to Best Single Seconds',
      '% within 0.100',
      '% within 0.200',
      '% within 0.500',
      'IQR Outliers',
    ]),
    ...report.drivers.flatMap((driver) =>
      driver.sectors.map((sector) => [
        driver.driver,
        sector.sector,
        sector.n,
        durationCell(sector.bestUs),
        durationCell(sector.meanUs),
        durationCell(sector.medianUs),
        durationCell(sector.sdUs),
        durationCell(sector.madUs),
        durationCell(sector.iqrUs),
        durationCell(sector.rangeUs),
        durationCell(sector.gapToBestMeanUs),
        durationCell(sector.gapToBestMedianUs),
        durationCell(sector.gapToBestSingleUs),
        percentageCell(sector.pctWithin100msOfMedian),
        percentageCell(sector.pctWithin200msOfMedian),
        percentageCell(sector.pctWithin500msOfMedian),
        sector.outlierCountIqr,
      ]),
    ),
  ];
}

function sectorMatrixSheet(report: AnalysisReport, benchmark: 'median' | 'average'): SheetData {
  const drivers = report.drivers.map((driver) => driver.driver);
  return [
    header(['Sector', 'Fastest Benchmark Seconds', ...drivers]),
    ...report.sectors.map((sector) => [
      sector.sector,
      durationCell(
        benchmark === 'median' ? sector.benchmark.bestMedianUs : sector.benchmark.bestMeanUs,
      ),
      ...drivers.map((driver) => {
        const entry = sector.drivers.find((candidate) => candidate.driver === driver);
        return durationCell(
          benchmark === 'median'
            ? (entry?.gapToBestMedianUs ?? null)
            : (entry?.gapToBestMeanUs ?? null),
        );
      }),
    ]),
  ];
}

function bestSectorsSheet(report: AnalysisReport): SheetData {
  return [
    header(['Sector', 'Best Sector Seconds', 'Driver']),
    ...report.sectors.flatMap((sector) => {
      const best = sector.benchmark.bestSingleUs;
      const leaders = sector.drivers.filter((driver) => driver.bestUs === best);
      return leaders.length > 0
        ? leaders.map((driver) => [sector.sector, durationCell(best), driver.driver])
        : [[sector.sector, durationCell(best), null]];
    }),
  ];
}

function stintsSheet(report: AnalysisReport): SheetData {
  return [
    header([
      'Driver',
      'Source File',
      'Stint',
      'Lap Count',
      'Full Timed Laps',
      'Runtime Laps',
      'Pace Laps',
      'Runtime Seconds',
      'Runtime',
      'Median Lap Seconds',
    ]),
    ...report.stints.map((stint) => [
      stint.driver,
      sourceBasename(stint.sourceFileName),
      stint.index,
      stint.lapCount,
      stint.fullTimedLapCount,
      stint.runtimeLapCount,
      stint.paceLapCount,
      durationCell(stint.runtimeUs),
      formatDurationUs(stint.runtimeUs),
      durationCell(stint.medianLapUs),
    ]),
  ];
}

function lapAuditSheet(report: AnalysisReport): SheetData {
  const sectors = report.sectors.map((sector) => sector.sector);
  return [
    header([
      'Driver',
      'Source File',
      'Source Row',
      'Run',
      'Lap',
      'Lap Time Seconds',
      'Clean',
      'Pit In',
      'Pit Out',
      'Runtime Eligible',
      'Pace Eligible',
      'Runtime Exclusion Reasons',
      'Pace Exclusion Reasons',
      'Exclusion Reason',
      'Fuel Level',
      ...sectors.map((sector) => `${sector} Seconds`),
    ]),
    ...report.lapAudit.map((lap) => [
      lap.driver,
      sourceBasename(lap.sourceFileName),
      lap.rowNumber,
      lap.run,
      lap.lapNumber,
      durationCell(lap.lapTimeUs),
      lap.clean,
      lap.pitIn,
      lap.pitOut,
      lap.runtimeEligible,
      lap.paceEligible,
      lap.runtimeExclusionReasons.join('; '),
      lap.paceExclusionReasons.join('; '),
      lap.exclusionReason,
      lap.fuelLevel,
      ...sectors.map((sector) => durationCell(lap.sectorsUs[sector] ?? null)),
    ]),
  ];
}

function methodologySheet(report: AnalysisReport): SheetData {
  return [
    header(['Method or filter', 'Definition']),
    ['Pace mode', report.configuration.paceMode],
    ['Default benchmark', report.configuration.benchmarkDefault],
    ['Runtime scope', report.methodology.runtime],
    ['Pace eligibility', report.methodology.pace],
    ['Clean percentage', report.methodology.cleanPercentage],
    ['Population SD', report.methodology.standardDeviation],
    ['MAD', 'Median absolute deviation of the selected pace sample.'],
    ['IQR', 'Q3 minus Q1 for the selected pace sample.'],
    ['Outliers', report.methodology.outliers],
    ['Theoretical lap', report.methodology.theoreticalBest],
    ['Penalties', report.methodology.penalties],
  ];
}

export async function createSpreadsheetExport(reportInput: AnalysisReport): Promise<Blob> {
  const report = validateAnalysisReportForExport(reportInput);
  const sheets = [
    sheet('Overview', overviewSheet(report)),
    sheet('Leaderboard', leaderboardSheet(report)),
    sheet('Sector Summary', sectorSummarySheet(report)),
    sheet('Sector Matrix Median', sectorMatrixSheet(report, 'median')),
    sheet('Sector Matrix Average', sectorMatrixSheet(report, 'average')),
    sheet('Best Sectors', bestSectorsSheet(report)),
    sheet('Stints', stintsSheet(report)),
    sheet('Lap Audit', lapAuditSheet(report)),
    sheet('Methodology', methodologySheet(report)),
  ];

  return writeXlsxFile(sheets, { fontFamily: 'Arial', fontSize: 10 }).toBlob();
}
