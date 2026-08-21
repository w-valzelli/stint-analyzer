import { describe, expect, it } from 'vitest';

import { detectHeaderRow, normalizeHeader } from '../../src/domain/parsing/headers';

describe('Garage 61 header detection', () => {
  it('normalizes whitespace and discovers sectors in numeric order', () => {
    const detection = detectHeaderRow([
      ['unrelated row'],
      [' DRIVER ', 'Lap-Time', 'Sector 10', 'Sector 2', 'Sector 1'],
    ]);

    expect(normalizeHeader('  Pit-in  ')).toBe('pit in');
    expect(detection?.rowIndex).toBe(1);
    expect(detection?.sectorColumns.map((sector) => sector.name)).toEqual(['S1', 'S2', 'S10']);
  });

  it('requires driver, lap time, and at least one sector', () => {
    expect(
      detectHeaderRow([
        ['Driver', 'Lap time'],
        ['Alice', 1],
      ]),
    ).toBeNull();
  });
});
