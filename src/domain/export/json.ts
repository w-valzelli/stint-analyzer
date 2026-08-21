import type { AnalysisReport } from '../model/report';
import { serializeAnalysisReport } from './serialization';
import { validateAnalysisReportForExport } from './validation';

export function createJsonExport(reportInput: AnalysisReport): string {
  const report = validateAnalysisReportForExport(reportInput);
  return `${JSON.stringify(serializeAnalysisReport(report), null, 2)}\n`;
}
