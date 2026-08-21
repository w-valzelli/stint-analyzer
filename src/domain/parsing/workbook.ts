import readXlsxFile from 'read-excel-file/browser';

import { Garage61ParseError, type ParsedWorkbook } from '../model/normalized';
import { parseDetectedGarage61Sheet, type Garage61Sheet, type RawCell } from './garage61';
import { detectHeaderRow, type HeaderDetection } from './headers';

export type WorkbookSheet = Garage61Sheet;

export type WorkbookSource = {
  id: string;
  name: string;
  hash: string;
};

const PREFERRED_SHEET_NAME = 'Session - Practice';

function asRawCell(value: unknown): RawCell {
  if (value === null || value === undefined || value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return String(value);
}

function asGarage61Sheet(sheet: {
  sheet: string;
  data: readonly (readonly unknown[])[];
}): WorkbookSheet {
  return {
    name: sheet.sheet,
    rows: sheet.data.map((row) => row.map(asRawCell)),
  };
}

export function selectGarage61Sheet(sheets: readonly WorkbookSheet[]): {
  sheet: WorkbookSheet;
  headerRow: HeaderDetection;
  fallbackSelected: boolean;
} {
  const preferred = sheets.find((sheet) => sheet.name.trim() === PREFERRED_SHEET_NAME);
  const candidates = preferred
    ? [preferred, ...sheets.filter((sheet) => sheet !== preferred)]
    : [...sheets];

  for (const [index, sheet] of candidates.entries()) {
    const headerRow = detectHeaderRow(sheet.rows);
    if (headerRow) {
      return {
        sheet,
        headerRow,
        fallbackSelected: sheet !== preferred || (preferred === undefined && index > 0),
      };
    }
  }

  throw new Garage61ParseError(
    'unsupported-workbook',
    'This workbook is not a Garage 61 export. Add a sheet with Driver, Lap time, and at least one Sector N column.',
  );
}

export function parseWorkbookSheets(
  sheets: readonly WorkbookSheet[],
  source: WorkbookSource,
): ParsedWorkbook {
  const selected = selectGarage61Sheet(sheets);
  return parseDetectedGarage61Sheet(selected.sheet, selected.headerRow, source, {
    fallbackSelected: selected.fallbackSelected,
  });
}

export async function parseWorkbookFile(
  file: Blob | ArrayBuffer,
  source: WorkbookSource,
): Promise<ParsedWorkbook> {
  try {
    const sheets = await readXlsxFile(file);
    return parseWorkbookSheets(sheets.map(asGarage61Sheet), source);
  } catch (error) {
    if (error instanceof Garage61ParseError) {
      throw error;
    }

    const detail = error instanceof Error ? error.message : 'The workbook could not be read.';
    throw new Garage61ParseError(
      'read-failed',
      `The file could not be read as an XLSX workbook: ${detail}`,
    );
  }
}
