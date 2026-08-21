import type { AnalysisReport, MetricStats } from '../model/report';
import { compactAnalysisData, formatDurationUs } from './serialization';
import { validateAnalysisReportForExport } from './validation';

export type MarkdownExportMode = 'summary' | 'full';

function escapeCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function table(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [
    `| ${headers.map(escapeCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
  ].join('\n');
}

function percentage(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

function signedDuration(value: number | null): string {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${formatDurationUs(value)}`;
}

function metricRows(stats: MetricStats): (string | number)[][] {
  return [
    ['Sample count', stats.n],
    ['Best', formatDurationUs(stats.bestUs)],
    ['Mean', formatDurationUs(stats.meanUs)],
    ['Median', formatDurationUs(stats.medianUs)],
    ['Population SD', formatDurationUs(stats.sdUs)],
    ['MAD', formatDurationUs(stats.madUs)],
    ['IQR', formatDurationUs(stats.iqrUs)],
    ['Range', formatDurationUs(stats.rangeUs)],
  ];
}

function sectorMatrix(report: AnalysisReport, benchmark: 'median' | 'average'): string {
  const drivers = report.drivers.map((driver) => driver.driver);
  const rows = report.sectors.map((sector) => {
    const benchmarkUs =
      benchmark === 'median' ? sector.benchmark.bestMedianUs : sector.benchmark.bestMeanUs;
    return [
      sector.sector,
      formatDurationUs(benchmarkUs),
      ...drivers.map((driver) => {
        const entry = sector.drivers.find((candidate) => candidate.driver === driver);
        return signedDuration(
          benchmark === 'median'
            ? (entry?.gapToBestMedianUs ?? null)
            : (entry?.gapToBestMeanUs ?? null),
        );
      }),
    ];
  });
  return table(['Sector', 'Fastest benchmark', ...drivers], rows);
}

function methodologyRows(report: AnalysisReport): (string | number)[][] {
  return [
    ['Runtime scope', report.methodology.runtime],
    ['Pace eligibility', report.methodology.pace],
    ['Clean percentage', report.methodology.cleanPercentage],
    ['Population SD', report.methodology.standardDeviation],
    ['IQR outliers', report.methodology.outliers],
    ['Theoretical best', report.methodology.theoreticalBest],
    ['Penalties', report.methodology.penalties],
  ];
}

function lapAudit(report: AnalysisReport): string {
  const sectors = report.sectors.map((sector) => sector.sector);
  return table(
    [
      'Driver',
      'Source file',
      'Run',
      'Lap',
      'Lap time',
      'Clean',
      'Pit in',
      'Pit out',
      'Runtime eligible',
      'Pace eligible',
      'Exclusion reason',
      'Fuel',
      ...sectors,
    ],
    report.lapAudit.map((lap) => [
      lap.driver,
      lap.sourceFileName,
      lap.run,
      lap.lapNumber,
      formatDurationUs(lap.lapTimeUs),
      lap.clean,
      lap.pitIn,
      lap.pitOut,
      lap.runtimeEligible,
      lap.paceEligible,
      lap.exclusionReason,
      lap.fuelLevel,
      ...sectors.map((sector) => formatDurationUs(lap.sectorsUs[sector] ?? null)),
    ]),
  );
}

export function createMarkdownExport(
  reportInput: AnalysisReport,
  mode: MarkdownExportMode,
): string {
  const report = validateAnalysisReportForExport(reportInput);
  const lines = [
    '---',
    `schema_version: '${report.schemaVersion}'`,
    "report_type: 'garage61-stint-analysis'",
    `generated_at: '${report.generatedAt}'`,
    `pace_mode: '${report.configuration.paceMode}'`,
    `benchmark_default: '${report.configuration.benchmarkDefault}'`,
    "ranking: 'runtime'",
    '---',
    '',
    '# Garage 61 Stint Analysis',
    '',
    '## Analysis scope',
    '',
    table(
      ['Sources', 'Drivers', 'Runtime laps', 'Pace laps', 'Pace mode'],
      [
        [
          report.overview.sourceFileCount,
          report.overview.driverCount,
          report.overview.runtimeLapCount,
          report.overview.paceLapCount,
          report.configuration.paceMode,
        ],
      ],
    ),
    '',
    '## Data quality and warnings',
    '',
    report.warnings.length === 0
      ? 'No data-quality warnings.'
      : table(
          ['Severity', 'Code', 'Message', 'Source', 'Row'],
          report.warnings.map((warning) => [
            warning.severity,
            warning.code,
            warning.message,
            warning.sourceFileName,
            warning.rowNumber,
          ]),
        ),
    '',
    '## Leaderboard',
    '',
    table(
      ['Pos', 'Driver', 'Runtime', 'Gap', 'Clean laps', 'Clean %', 'Best pace', 'Median pace'],
      report.leaderboard.map((row) => [
        row.position,
        row.driver,
        formatDurationUs(row.runtimeUs),
        signedDuration(row.gapUs),
        `${row.cleanLapCount}/${row.eligibleNonPitLapCount}`,
        percentage(row.cleanPercentage),
        formatDurationUs(row.lapStats.bestUs),
        formatDurationUs(row.lapStats.medianUs),
      ]),
    ),
    '',
    '## Driver overview',
    '',
    table(
      ['Driver', 'Runtime laps', 'Pace laps', 'Best', 'Mean', 'Median', 'SD', 'Theoretical'],
      report.drivers.map((driver) => [
        driver.driver,
        driver.runtimeLapCount,
        driver.paceLapCount,
        formatDurationUs(driver.lapStats.bestUs),
        formatDurationUs(driver.lapStats.meanUs),
        formatDurationUs(driver.lapStats.medianUs),
        formatDurationUs(driver.lapStats.sdUs),
        formatDurationUs(driver.theoreticalBestUs),
      ]),
    ),
    '',
    '## Sector benchmark — median',
    '',
    sectorMatrix(report, 'median'),
    '',
    '## Sector benchmark — average',
    '',
    sectorMatrix(report, 'average'),
    '',
    '## Best sectors and theoretical laps',
    '',
    table(
      ['Driver', 'Best actual', 'Theoretical best', 'Execution gap'],
      report.drivers.map((driver) => [
        driver.driver,
        formatDurationUs(driver.lapStats.bestUs),
        formatDurationUs(driver.theoreticalBestUs),
        signedDuration(driver.executionGapUs),
      ]),
    ),
    '',
    '## Sector consistency',
    '',
    table(
      ['Driver', 'Mean SD', 'Mean MAD', 'Mean IQR', 'Mean range', 'IQR outliers'],
      report.consistency.map((summary) => [
        summary.driver,
        formatDurationUs(summary.sd.meanUs),
        formatDurationUs(summary.mad.meanUs),
        formatDurationUs(summary.iqr.meanUs),
        formatDurationUs(summary.range.meanUs),
        summary.iqrOutlierCount,
      ]),
    ),
    '',
    '## Stint progression summary',
    '',
    table(
      ['Driver', 'Source', 'Stint', 'Runtime laps', 'Pace laps', 'Runtime', 'Median pace'],
      report.stints.map((stint) => [
        stint.driver,
        stint.sourceFileName,
        stint.index,
        stint.runtimeLapCount,
        stint.paceLapCount,
        formatDurationUs(stint.runtimeUs),
        formatDurationUs(stint.medianLapUs),
      ]),
    ),
    '',
    '## Driver detail',
    '',
    ...report.drivers.flatMap((driver) => [
      `### ${driver.driver}`,
      '',
      table(['Metric', 'Value'], metricRows(driver.lapStats)),
      '',
      table(
        ['Sector', 'N', 'Best', 'Mean', 'Median', 'SD', 'MAD', 'Gap to best median'],
        driver.sectors.map((sector) => [
          sector.sector,
          sector.n,
          formatDurationUs(sector.bestUs),
          formatDurationUs(sector.meanUs),
          formatDurationUs(sector.medianUs),
          formatDurationUs(sector.sdUs),
          formatDurationUs(sector.madUs),
          signedDuration(sector.gapToBestMedianUs),
        ]),
      ),
      '',
    ]),
  ];

  if (mode === 'full') {
    lines.push('## Lap audit', '', lapAudit(report), '');
  }

  lines.push(
    '## Methodology',
    '',
    table(['Method', 'Definition'], methodologyRows(report)),
    '',
    '## Machine-readable compact data',
    '',
    '```json',
    JSON.stringify(compactAnalysisData(report)),
    '```',
    '',
  );

  return lines.join('\n');
}
