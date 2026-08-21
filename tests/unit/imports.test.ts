import { describe, expect, it } from 'vitest';

import {
  importWorkbookFiles,
  trackMismatchMessage,
} from '../../src/domain/parsing/imports';

function workbook(trackName: string | null) {
  return {
    source: {
      id: 'a'.repeat(64),
      name: 'session.xlsx',
      hash: 'a'.repeat(64),
      sheetName: 'Session - Practice',
      driverName: 'Alice',
      trackName,
      carName: 'Prototype X',
      driverNames: ['Alice'],
      sectorNames: ['S1'],
      timedLapCount: 0,
      fullTimedLapCount: 0,
      partialLapCount: 0,
      warningCount: 0,
    },
    laps: [],
    warnings: [],
  };
}

describe('importWorkbookFiles', () => {
  it('reports a track mismatch without rejecting a workbook with no track metadata', () => {
    const existing = workbook('Synthetic Ring');
    const candidate = workbook('Other Ring');

    expect(trackMismatchMessage(candidate, [existing])).toContain(
      'All imported lap data should use the same track.',
    );
    expect(trackMismatchMessage(workbook(null), [existing])).toBeNull();
    expect(trackMismatchMessage(workbook('synthetic ring'), [existing])).toBeNull();
  });

  it('reports invalid workbook content without throwing from the batch', async () => {
    const file = new File(['not an xlsx'], 'broken.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const batch = await importWorkbookFiles([file]);

    expect(batch.parsed).toHaveLength(0);
    expect(batch.failures[0]?.name).toBe('broken.xlsx');
    expect(batch.failures[0]?.message).toContain('could not be read');
  });
});
