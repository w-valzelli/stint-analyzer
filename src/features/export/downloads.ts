import type { AnalysisReport } from '../../domain/model/report';
import { createJsonExport } from '../../domain/export/json';
import { createMarkdownExport } from '../../domain/export/markdown';
import { createSpreadsheetExport } from '../../domain/export/spreadsheet';

export const exportFormats = ['xlsx', 'json', 'markdown-summary', 'markdown-full'] as const;
export type ExportFormat = (typeof exportFormats)[number];

function timestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}`;
}

export function exportFilename(format: ExportFormat, date = new Date()): string {
  const base = `garage61-analysis-${timestamp(date)}`;
  if (format === 'markdown-summary') return `${base}-summary.md`;
  if (format === 'markdown-full') return `${base}-full.md`;
  return `${base}.${format}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function downloadReportFormats(
  report: AnalysisReport,
  formats: readonly ExportFormat[],
  date = new Date(),
): Promise<void> {
  const files = await Promise.all(
    formats.map(async (format) => {
      if (format === 'xlsx') {
        return {
          blob: await createSpreadsheetExport(report),
          filename: exportFilename(format, date),
        };
      }
      if (format === 'json') {
        return {
          blob: new Blob([createJsonExport(report)], { type: 'application/json;charset=utf-8' }),
          filename: exportFilename(format, date),
        };
      }
      return {
        blob: new Blob(
          [createMarkdownExport(report, format === 'markdown-full' ? 'full' : 'summary')],
          { type: 'text/markdown;charset=utf-8' },
        ),
        filename: exportFilename(format, date),
      };
    }),
  );

  files.forEach(({ blob, filename }) => triggerDownload(blob, filename));
}
