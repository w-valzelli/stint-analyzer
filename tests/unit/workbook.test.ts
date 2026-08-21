import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { Garage61ParseError } from '../../src/domain/model/normalized';
import {
  parseWorkbookFile,
  parseWorkbookSheets,
  selectGarage61Sheet,
} from '../../src/domain/parsing/workbook';
import {
  exactGarage61Sheets,
  fallbackGarage61Sheets,
  metadataGarage61Sheets,
  unrelatedSheets,
  validSource,
} from '../fixtures/garage61Rows';

describe('Garage 61 workbook selection', () => {
  it('prefers Session - Practice', () => {
    const selected = selectGarage61Sheet(exactGarage61Sheets);
    expect(selected.sheet.name).toBe('Session - Practice');
    expect(selected.fallbackSelected).toBe(false);
  });

  it('falls back to a sheet with matching headers', () => {
    const result = parseWorkbookSheets(fallbackGarage61Sheets, validSource);
    expect(result.source.sheetName).toBe('Data');
    expect(result.warnings.some((item) => item.code === 'fallback-sheet')).toBe(true);
    expect(result.source.sectorNames).toEqual(['S1', 'S2']);
  });

  it('extracts driver, track, and car metadata from the Overview sheet', () => {
    const result = parseWorkbookSheets(metadataGarage61Sheets, validSource);

    expect(result.source.driverName).toBe('Alice');
    expect(result.source.trackName).toBe('Synthetic Ring');
    expect(result.source.carName).toBe('Prototype X');
  });

  it('rejects unrelated workbooks with a useful message', () => {
    expect(() => selectGarage61Sheet(unrelatedSheets)).toThrow(Garage61ParseError);
    expect(() => selectGarage61Sheet(unrelatedSheets)).toThrow(
      'Driver, Lap time, and at least one Sector N',
    );
  });

  it('reads the committed XLSX fixture through the browser parser', async () => {
    const bytes = await readFile(path.resolve('tests/fixtures/garage61-session.xlsx'));
    const workbook = await parseWorkbookFile(new Uint8Array(bytes).buffer, validSource);

    expect(workbook.source.sheetName).toBe('Session - Practice');
    expect(workbook.source.driverNames).toEqual(['Alice']);
    expect(workbook.source.fullTimedLapCount).toBe(2);
  });
});
