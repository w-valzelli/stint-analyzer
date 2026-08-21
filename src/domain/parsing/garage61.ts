import {
  lapSchema,
  type Lap,
  type ParsedWorkbook,
  type ParserWarning,
  type SourceSummary,
} from '../model/normalized';
import { parseDurationToMicroseconds } from './durations';
import { detectHeaderRow, type HeaderDetection } from './headers';

export const SECTOR_SUM_MISMATCH_TOLERANCE_US = 250_000;

export type RawCell = string | number | boolean | Date | null | undefined;

export type Garage61Sheet = {
  name: string;
  rows: readonly (readonly RawCell[])[];
};

type ParseSource = {
  id: string;
  name: string;
  hash: string;
};

function textValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function integerValue(value: unknown): number | null {
  const parsed = numberValue(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function booleanValue(value: unknown): { value: boolean | null; invalid: boolean } {
  if (value === null || value === undefined || value === '') {
    return { value: null, invalid: false };
  }

  if (typeof value === 'boolean') {
    return { value, invalid: false };
  }

  if (typeof value === 'number' && (value === 0 || value === 1)) {
    return { value: value === 1, invalid: false };
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'clean'].includes(normalized)) {
      return { value: true, invalid: false };
    }
    if (['0', 'false', 'no', 'n', 'dirty'].includes(normalized)) {
      return { value: false, invalid: false };
    }
  }

  return { value: null, invalid: true };
}

function startedAtValue(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return textValue(value);
}

function rowHasData(row: readonly unknown[]): boolean {
  return row.some((value) => textValue(value) !== null);
}

function warning(
  source: ParseSource,
  code: ParserWarning['code'],
  message: string,
  rowNumber: number | null,
  severity: ParserWarning['severity'] = 'warning',
): ParserWarning {
  return { code, severity, message, sourceFileName: source.name, rowNumber };
}

function cell(row: readonly RawCell[], index: number | undefined): RawCell {
  return index === undefined ? undefined : row[index];
}

function classifyLap(
  lapNumber: number | null,
  lapTimeUs: number | null,
  sectorsUs: Record<string, number | null>,
): { isFullTimedLap: boolean; exclusionReason: string | null } {
  if (lapNumber === 0) {
    return { isFullTimedLap: false, exclusionReason: 'Lap 0 is a setup or output row.' };
  }

  if (lapTimeUs === null) {
    return { isFullTimedLap: false, exclusionReason: 'Lap time is missing or not numeric.' };
  }

  if (Object.values(sectorsUs).some((value) => value === null)) {
    return { isFullTimedLap: false, exclusionReason: 'One or more sector times are missing.' };
  }

  return { isFullTimedLap: true, exclusionReason: null };
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function parseGarage61Sheet(
  sheet: Garage61Sheet,
  source: ParseSource,
  options: { fallbackSelected?: boolean } = {},
): ParsedWorkbook {
  const detection = detectHeaderRow(sheet.rows);
  if (!detection) {
    throw new Error(
      'This sheet does not contain Driver, Lap time, and at least one Sector N column.',
    );
  }

  return parseDetectedGarage61Sheet(sheet, detection, source, options);
}

export function parseDetectedGarage61Sheet(
  sheet: Garage61Sheet,
  detection: HeaderDetection,
  source: ParseSource,
  options: { fallbackSelected?: boolean } = {},
): ParsedWorkbook {
  const warnings: ParserWarning[] = [];
  const laps: Lap[] = [];
  const rows = sheet.rows.slice(detection.rowIndex + 1);

  if (options.fallbackSelected) {
    warnings.push(
      warning(
        source,
        'fallback-sheet',
        `The exact Session - Practice sheet was not used. The app selected ${sheet.name} by its headers.`,
        null,
        'info',
      ),
    );
  }

  if (detection.columns.clean === undefined) {
    warnings.push(
      warning(
        source,
        'missing-clean-column',
        'The Clean column is missing. Clean-only pace analysis is unavailable for this source.',
        null,
      ),
    );
  }

  for (const [offset, row] of rows.entries()) {
    const rowNumber = detection.rowIndex + offset + 2;
    if (!rowHasData(row)) {
      continue;
    }

    const driver = textValue(cell(row, detection.columns.driver));
    if (!driver) {
      warnings.push(
        warning(
          source,
          'missing-driver',
          `Row ${rowNumber} has data but no driver name.`,
          rowNumber,
        ),
      );
      continue;
    }

    const lapTimeUs = parseDurationToMicroseconds(cell(row, detection.columns.lapTime));
    const lapNumber = integerValue(cell(row, detection.columns.lap));
    const sectorsUs = Object.fromEntries(
      detection.sectorColumns.map((sector) => [
        sector.name,
        parseDurationToMicroseconds(cell(row, sector.index)),
      ]),
    );
    const classification = classifyLap(lapNumber, lapTimeUs, sectorsUs);
    const sectorValues = Object.values(sectorsUs);
    const sectorSumUs = sectorValues.every((value): value is number => value !== null)
      ? sectorValues.reduce((sum, value) => sum + value, 0)
      : null;
    const sectorSumDeltaUs =
      lapTimeUs !== null && sectorSumUs !== null ? lapTimeUs - sectorSumUs : null;

    if (!classification.isFullTimedLap) {
      warnings.push(
        warning(
          source,
          'partial-row',
          `Row ${rowNumber} is excluded from full timed laps: ${classification.exclusionReason}`,
          rowNumber,
          'info',
        ),
      );
      if (lapTimeUs !== null && sectorValues.some((value) => value === null)) {
        warnings.push(
          warning(
            source,
            'missing-sector-value',
            `Row ${rowNumber} has a missing or non-numeric sector value.`,
            rowNumber,
          ),
        );
      }
    }

    if (
      sectorSumDeltaUs !== null &&
      Math.abs(sectorSumDeltaUs) > SECTOR_SUM_MISMATCH_TOLERANCE_US
    ) {
      warnings.push(
        warning(
          source,
          'sector-sum-mismatch',
          `Row ${rowNumber} has a sector sum that differs from lap time by more than 0.250 seconds.`,
          rowNumber,
          'info',
        ),
      );
    }

    const cleanResult = booleanValue(cell(row, detection.columns.clean));
    if (cleanResult.invalid) {
      warnings.push(
        warning(
          source,
          'invalid-boolean',
          `Row ${rowNumber} has an unreadable Clean value.`,
          rowNumber,
        ),
      );
    }

    const pitInResult = booleanValue(cell(row, detection.columns.pitIn));
    const pitOutResult = booleanValue(cell(row, detection.columns.pitOut));
    if (pitInResult.invalid || pitOutResult.invalid) {
      warnings.push(
        warning(
          source,
          'invalid-boolean',
          `Row ${rowNumber} has an unreadable pit flag.`,
          rowNumber,
        ),
      );
    }

    const lap = lapSchema.parse({
      id: `${source.id}:row-${rowNumber}`,
      sourceFileId: source.id,
      sourceFileName: source.name,
      rowNumber,
      driver,
      run: integerValue(cell(row, detection.columns.run)),
      lapNumber,
      startedAt: startedAtValue(cell(row, detection.columns.startedAt)),
      lapTimeUs,
      sectorsUs,
      clean: cleanResult.value,
      pitIn: pitInResult.value ?? false,
      pitOut: pitOutResult.value ?? false,
      fuelLevel: numberValue(cell(row, detection.columns.fuelLevel)),
      fuelUsed: numberValue(cell(row, detection.columns.fuelUsed)),
      fuelAdded: numberValue(cell(row, detection.columns.fuelAdded)),
      trackTemp: numberValue(cell(row, detection.columns.trackTemp)),
      airTemp: numberValue(cell(row, detection.columns.airTemp)),
      isFullTimedLap: classification.isFullTimedLap,
      classification: classification.isFullTimedLap ? 'full' : 'partial',
      exclusionReason: classification.exclusionReason,
      sectorSumDeltaUs,
    });
    laps.push(lap);
  }

  if (laps.length === 0) {
    warnings.push(
      warning(source, 'no-lap-rows', 'No usable lap rows were found after the header.', null),
    );
  }

  const sourceSummary: SourceSummary = {
    id: source.id,
    name: source.name,
    hash: source.hash,
    sheetName: sheet.name,
    driverNames: uniqueSorted(laps.map((lap) => lap.driver)),
    sectorNames: detection.sectorColumns.map((sector) => sector.name),
    timedLapCount: laps.filter((lap) => lap.lapTimeUs !== null).length,
    fullTimedLapCount: laps.filter((lap) => lap.isFullTimedLap).length,
    partialLapCount: laps.filter((lap) => !lap.isFullTimedLap).length,
    warningCount: warnings.length,
  };

  return { source: sourceSummary, laps, warnings };
}
