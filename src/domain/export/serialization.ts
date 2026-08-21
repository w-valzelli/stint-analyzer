import { z } from 'zod';

import { analysisReportSchema, type AnalysisReport } from '../model/report';

const jsonPrimitiveSchema = z.union([
  z.string(),
  z.number().refine(Number.isFinite, 'Expected a finite number'),
  z.boolean(),
  z.null(),
]);
type JsonValue = z.infer<typeof jsonPrimitiveSchema> | JsonValue[] | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([jsonPrimitiveSchema, z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)]),
);

export const serializedAnalysisReportSchema = z.object({
  schema_version: z.literal('1.0'),
  report_type: z.literal('garage61-stint-analysis'),
  generated_at: z.string().min(1),
  configuration: z.record(z.string(), jsonValueSchema),
  methodology: z.record(z.string(), jsonValueSchema),
  sources: z.array(z.record(z.string(), jsonValueSchema)),
  warnings: z.array(z.record(z.string(), jsonValueSchema)),
  overview: z.record(z.string(), jsonValueSchema),
  consistency: z.array(z.record(z.string(), jsonValueSchema)),
  leaderboard: z.array(z.record(z.string(), jsonValueSchema)),
  drivers: z.array(z.record(z.string(), jsonValueSchema)),
  sectors: z.array(z.record(z.string(), jsonValueSchema)),
  stints: z.array(z.record(z.string(), jsonValueSchema)),
  lap_audit: z.array(z.record(z.string(), jsonValueSchema)),
});
export type SerializedAnalysisReport = z.infer<typeof serializedAnalysisReportSchema>;

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

export function microsecondsToSeconds(value: number | null): number | null {
  return value === null ? null : value / 1_000_000;
}

export function formatDurationUs(value: number | null): string {
  if (value === null) return '—';

  const sign = value < 0 ? '-' : '';
  const totalMilliseconds = Math.round(Math.abs(value) / 1_000);
  const milliseconds = totalMilliseconds % 1_000;
  const totalSeconds = Math.floor(totalMilliseconds / 1_000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    return `${sign}${hours}:${String(totalMinutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  return `${sign}${totalMinutes}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
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
