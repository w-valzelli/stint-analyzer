import { analysisReportSchema, type AnalysisReport } from '../model/report';
import { serializedAnalysisReportSchema, type SerializedAnalysisReport } from './serialized-report';

export { serializedAnalysisReportSchema, type SerializedAnalysisReport };

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const omittedKeys = new Set([
  'hash',
  'id',
  'lapId',
  'sourceFileId',
  'stintId',
  'firstLapId',
  'lastLapId',
  'outLapId',
  'inLapId',
]);

export function sourceBasename(value: string): string {
  return value.split(/[\\/]/).at(-1) ?? value;
}

function snakeCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function exportKey(key: string): string {
  return key.endsWith('Us') ? `${snakeCase(key.slice(0, -2))}_seconds` : snakeCase(key);
}

function exportValue(value: unknown, key = ''): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return key.endsWith('Us') ? value / 1_000_000 : value;
  if (Array.isArray(value)) return value.map((entry) => exportValue(entry));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([entryKey]) => !omittedKeys.has(entryKey))
        .map(([entryKey, entryValue]) => [
          exportKey(entryKey),
          exportValue(
            entryKey === 'sourceFileName' || entryKey === 'name'
              ? sourceBasename(String(entryValue))
              : entryValue,
            entryKey,
          ),
        ]),
    );
  }
  throw new Error(`Unsupported export value for ${key || 'report'}.`);
}

function objectValue(value: unknown): Record<string, JsonValue> {
  return exportValue(value) as Record<string, JsonValue>;
}

export function serializeAnalysisReport(reportInput: AnalysisReport): SerializedAnalysisReport {
  const report = analysisReportSchema.parse(reportInput);
  const selectedStints = report.stints
    .filter((stint) => stint.runtimeLapCount > 0)
    .map((stint) => ({
      driver: stint.driver,
      source_file_name: sourceBasename(stint.sourceFileName),
      stint_index: stint.index,
    }));

  return serializedAnalysisReportSchema.parse({
    schema_version: report.schemaVersion,
    report_type: 'garage61-stint-analysis',
    generated_at: report.generatedAt,
    configuration: {
      pace_mode: report.configuration.paceMode,
      benchmark_default: report.configuration.benchmarkDefault,
      selected_stints: selectedStints,
    },
    methodology: objectValue(report.methodology),
    sources: report.sources.map((source) => objectValue(source)),
    warnings: report.warnings.map((warning) => objectValue(warning)),
    overview: objectValue(report.overview),
    consistency: report.consistency.map((summary) => objectValue(summary)),
    leaderboard: report.leaderboard.map((row) => objectValue(row)),
    drivers: report.drivers.map((driver) => objectValue(driver)),
    sectors: report.sectors.map((sector) => objectValue(sector)),
    stints: report.stints.map((stint) => objectValue(stint)),
    lap_audit: report.lapAudit.map((lap) => objectValue(lap)),
  });
}

export function compactAnalysisData(report: AnalysisReport) {
  const serialized = serializeAnalysisReport(report);
  return {
    schema_version: serialized.schema_version,
    report_type: serialized.report_type,
    generated_at: serialized.generated_at,
    configuration: serialized.configuration,
    methodology: serialized.methodology,
    warnings: serialized.warnings,
    leaderboard: serialized.leaderboard,
    drivers: serialized.drivers,
    sectors: serialized.sectors,
  };
}
