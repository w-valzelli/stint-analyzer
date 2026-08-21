import { Buffer } from 'node:buffer';

import readXlsxFile from 'read-excel-file/node';
import { describe, expect, it } from 'vitest';

import { createJsonExport } from '../../src/domain/export/json';
import { createMarkdownExport } from '../../src/domain/export/markdown';
import {
  createSpreadsheetExport,
  spreadsheetSheetNames,
} from '../../src/domain/export/spreadsheet';
import {
  serializeAnalysisReport,
  serializedAnalysisReportSchema,
} from '../../src/domain/export/serialization';
import {
  ExportValidationError,
  validateAnalysisReportForExport,
} from '../../src/domain/export/validation';
import type { AnalysisReport } from '../../src/domain/model/report';
import { makeAnalysisReport } from '../fixtures/analysisReport';

describe('report exports', () => {
  it('serializes a versioned JSON report with seconds, basenames, and finite values', () => {
    const json = createJsonExport(makeAnalysisReport());
    const parsed = serializedAnalysisReportSchema.parse(JSON.parse(json));

    expect(parsed.report_type).toBe('garage61-stint-analysis');
    expect(parsed.sources[0].name).toBe('session-a.xlsx');
    expect(parsed.leaderboard[0]).toMatchObject({ driver: 'Bob', runtime_seconds: 18.5 });
    expect(json).not.toMatch(/NaN|Infinity|runtime_us|source_file_id/);
    expect(serializeAnalysisReport(makeAnalysisReport())).toEqual(parsed);
  });

  it('blocks an invalid report before export', () => {
    const report = makeAnalysisReport();
    const invalid = {
      ...report,
      drivers: [{ ...report.drivers[0], cleanPercentage: Number.NaN }, ...report.drivers.slice(1)],
    } as AnalysisReport;

    expect(() => validateAnalysisReportForExport(invalid)).toThrow(ExportValidationError);
  });

  it('creates deterministic Summary and Full Markdown with compact exact JSON', () => {
    const report = makeAnalysisReport();
    const summary = createMarkdownExport(report, 'summary');
    const full = createMarkdownExport(report, 'full');
    const requiredSections = [
      '## Analysis scope',
      '## Data quality and warnings',
      '## Leaderboard',
      '## Driver overview',
      '## Sector benchmark — median',
      '## Sector benchmark — average',
      '## Best sectors and theoretical laps',
      '## Sector consistency',
      '## Stint progression summary',
      '## Driver detail',
      '## Methodology',
      '## Machine-readable compact data',
    ];

    expect(summary).toContain("schema_version: '1.0'");
    expect(summary).toContain("pace_mode: 'clean-non-pit'");
    expect(summary).not.toContain('## Lap audit');
    expect(full).toContain('## Lap audit');
    expect(requiredSections.map((section) => summary.indexOf(section))).toEqual(
      [...requiredSections.map((section) => summary.indexOf(section))].sort((a, b) => a - b),
    );

    const compactMatch = summary.match(/## Machine-readable compact data\n\n```json\n(.+)\n```/);
    expect(compactMatch).not.toBeNull();
    const compact = JSON.parse(compactMatch?.[1] ?? '{}');
    expect(compact.leaderboard[0]).toMatchObject({ driver: 'Bob', runtime_seconds: 18.5 });
    expect(compact).not.toHaveProperty('lap_audit');
    expect(summary).not.toMatch(/NaN|Infinity/);
  });

  it('creates a workbook that re-opens with every required sheet and numeric facts', async () => {
    const report = makeAnalysisReport();
    const blob = await createSpreadsheetExport(report);
    const workbook = await readXlsxFile(Buffer.from(await blob.arrayBuffer()));

    expect(workbook.map((sheet) => sheet.sheet)).toEqual(spreadsheetSheetNames);
    const leaderboard = workbook.find((sheet) => sheet.sheet === 'Leaderboard')?.data;
    expect(leaderboard).toBeDefined();
    expect(leaderboard?.[1]?.[1]).toBe('Bob');
    expect(leaderboard?.[1]?.[2]).toBe(18.5);
    expect(workbook.find((sheet) => sheet.sheet === 'Sector Summary')?.data).toHaveLength(
      1 + report.drivers.reduce((total, driver) => total + driver.sectors.length, 0),
    );
    expect(workbook.find((sheet) => sheet.sheet === 'Lap Audit')?.data).toHaveLength(
      1 + report.lapAudit.length,
    );
  });
});
