import { z } from 'zod';

export const lapClassificationSchema = z.enum(['full', 'partial']);
export type LapClassification = z.infer<typeof lapClassificationSchema>;

export const warningSeveritySchema = z.enum(['info', 'warning', 'error']);
export type WarningSeverity = z.infer<typeof warningSeveritySchema>;

export const parserWarningCodeSchema = z.enum([
  'fallback-sheet',
  'missing-clean-column',
  'missing-driver',
  'missing-sector-value',
  'invalid-boolean',
  'partial-row',
  'sector-sum-mismatch',
  'no-lap-rows',
]);
export type ParserWarningCode = z.infer<typeof parserWarningCodeSchema>;

export const parserWarningSchema = z.object({
  code: parserWarningCodeSchema,
  severity: warningSeveritySchema,
  message: z.string().min(1),
  sourceFileName: z.string().min(1),
  rowNumber: z.number().int().positive().nullable(),
});
export type ParserWarning = z.infer<typeof parserWarningSchema>;

const nullablePositiveIntegerSchema = z.number().int().positive().nullable();
const nullableNumberSchema = z
  .number()
  .refine(Number.isFinite, 'Expected a finite number')
  .nullable();

export const lapSchema = z.object({
  id: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourceFileName: z.string().min(1),
  rowNumber: z.number().int().positive(),
  driver: z.string().min(1),
  run: z.number().int().nullable(),
  lapNumber: z.number().int().nullable(),
  startedAt: z.string().nullable(),
  lapTimeUs: nullablePositiveIntegerSchema,
  sectorsUs: z.record(z.string(), nullablePositiveIntegerSchema),
  clean: z.boolean().nullable(),
  pitIn: z.boolean(),
  pitOut: z.boolean(),
  fuelLevel: nullableNumberSchema,
  fuelUsed: nullableNumberSchema,
  fuelAdded: nullableNumberSchema,
  trackTemp: nullableNumberSchema,
  airTemp: nullableNumberSchema,
  isFullTimedLap: z.boolean(),
  classification: lapClassificationSchema,
  exclusionReason: z.string().nullable(),
  sectorSumDeltaUs: z.number().int().nullable(),
});
export type Lap = z.infer<typeof lapSchema>;

export const sourceSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  sheetName: z.string().min(1),
  driverNames: z.array(z.string()),
  sectorNames: z.array(z.string()),
  timedLapCount: z.number().int().nonnegative(),
  fullTimedLapCount: z.number().int().nonnegative(),
  partialLapCount: z.number().int().nonnegative(),
  warningCount: z.number().int().nonnegative(),
});
export type SourceSummary = z.infer<typeof sourceSummarySchema>;

export const parsedWorkbookSchema = z.object({
  source: sourceSummarySchema,
  laps: z.array(lapSchema),
  warnings: z.array(parserWarningSchema),
});
export type ParsedWorkbook = z.infer<typeof parsedWorkbookSchema>;

export class Garage61ParseError extends Error {
  readonly code: 'unsupported-workbook' | 'read-failed';

  constructor(code: 'unsupported-workbook' | 'read-failed', message: string) {
    super(message);
    this.name = 'Garage61ParseError';
    this.code = code;
  }
}
