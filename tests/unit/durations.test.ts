import { describe, expect, it } from 'vitest';

import { formatDurationUs, MICROSECONDS_PER_SECOND } from '../../src/shared/durations';
import { parseWorkbookDurationToMicroseconds } from '../../src/domain/parsing/workbook-duration';

describe('parseWorkbookDurationToMicroseconds', () => {
  it('converts Excel day fractions without millisecond rounding', () => {
    expect(parseWorkbookDurationToMicroseconds(10.123456 / 86_400)).toBe(10_123_456);
  });

  it('parses clock strings', () => {
    expect(parseWorkbookDurationToMicroseconds('01:23.456')).toBe(83_456_000);
    expect(parseWorkbookDurationToMicroseconds('00:01:23.456')).toBe(83_456_000);
  });

  it('returns null for placeholders and non-positive values', () => {
    expect(parseWorkbookDurationToMicroseconds('—')).toBeNull();
    expect(parseWorkbookDurationToMicroseconds(0)).toBeNull();
    expect(parseWorkbookDurationToMicroseconds(-1)).toBeNull();
  });

  it('keeps the unit explicit', () => {
    expect(MICROSECONDS_PER_SECOND).toBe(1_000_000);
  });
});

describe('formatDurationUs', () => {
  it('formats lap times and runtime in motorsport notation', () => {
    expect(formatDurationUs(null)).toBe('—');
    expect(formatDurationUs(0)).toBe('0:00.000');
    expect(formatDurationUs(-1_234_567)).toBe('-0:01.235');
    expect(formatDurationUs(1_234_567)).toBe('0:01.235');
    expect(formatDurationUs(83_456_000)).toBe('1:23.456');
    expect(formatDurationUs(60_000_000)).toBe('1:00.000');
    expect(formatDurationUs(754_567_000)).toBe('12:34.567');
    expect(formatDurationUs(3_600_000_000)).toBe('1:00:00.000');
    expect(formatDurationUs(3_754_567_000)).toBe('1:02:34.567');
  });
});
