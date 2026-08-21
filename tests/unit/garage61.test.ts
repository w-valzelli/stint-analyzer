import { describe, expect, it } from 'vitest';

import { parseGarage61Sheet } from '../../src/domain/parsing/garage61';
import { exactGarage61Sheets, validSource } from '../fixtures/garage61Rows';

describe('parseGarage61Sheet', () => {
  it('normalizes full, pit, clean, fuel, and environment fields', () => {
    const result = parseGarage61Sheet(exactGarage61Sheets[1], validSource);
    const fullLap = result.laps.find((lap) => lap.lapNumber === 1);
    const pitLap = result.laps.find((lap) => lap.lapNumber === 2);

    expect(result.source.driverNames).toEqual(['Alice']);
    expect(result.source.sectorNames).toEqual(['S1', 'S2', 'S3']);
    expect(fullLap?.isFullTimedLap).toBe(true);
    expect(fullLap?.clean).toBe(true);
    expect(fullLap?.run).toBe(1);
    expect(fullLap?.startedAt).toBe('2026-08-21T10:01:00Z');
    expect(fullLap?.airTemp).toBe(21.1);
    expect(fullLap?.fuelLevel).toBe(39.2);
    expect(fullLap?.trackTemp).toBe(24.6);
    expect(pitLap?.clean).toBe(false);
    expect(pitLap?.pitIn).toBe(true);
    expect(pitLap?.pitOut).toBe(false);
    expect(pitLap?.isFullTimedLap).toBe(true);
    expect(result.laps.find((lap) => lap.lapNumber === 3)?.pitOut).toBe(true);
  });

  it('warns when the optional Clean column is missing', () => {
    const result = parseGarage61Sheet(
      {
        name: 'Data',
        rows: [
          ['Driver', 'Lap time', 'Sector 1'],
          ['Bob', '00:00:10.500', '00:00:05.250'],
        ],
      },
      validSource,
    );

    expect(result.laps[0]?.clean).toBeNull();
    expect(result.warnings.some((item) => item.code === 'missing-clean-column')).toBe(true);
  });

  it('keeps lap zero, missing sectors, and non-numeric times out of full timed laps', () => {
    const result = parseGarage61Sheet(exactGarage61Sheets[1], validSource);
    const lapZero = result.laps.find((lap) => lap.lapNumber === 0);
    const missingSector = result.laps.find((lap) => lap.lapNumber === 4);
    const trailing = result.laps.find((lap) => lap.lapNumber === 5);

    expect(lapZero?.classification).toBe('partial');
    expect(lapZero?.exclusionReason).toContain('Lap 0');
    expect(missingSector?.exclusionReason).toContain('sector');
    expect(trailing?.lapTimeUs).toBeNull();
    expect(result.source.fullTimedLapCount).toBe(3);
    expect(result.warnings.some((item) => item.code === 'missing-sector-value')).toBe(true);
    expect(result.warnings.some((item) => item.code === 'partial-row')).toBe(true);
  });
});
