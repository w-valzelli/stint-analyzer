import { describe, expect, it } from 'vitest';

import { formatDurationUs, formatGapUs } from '../../src/lib/durations';
import {
  MICROSECONDS_PER_SECOND,
  parseDurationToMicroseconds,
} from '../../src/domain/parsing/durations';

describe('parseDurationToMicroseconds', () => {
  it('converts Excel day fractions without millisecond rounding', () => {
    expect(parseDurationToMicroseconds(10.123456 / 86_400)).toBe(10_123_456);
  });

  it('parses clock strings', () => {
    expect(parseDurationToMicroseconds('01:23.456')).toBe(83_456_000);
    expect(parseDurationToMicroseconds('00:01:23.456')).toBe(83_456_000);
  });

  it('returns null for placeholders and non-positive values', () => {
    expect(parseDurationToMicroseconds('—')).toBeNull();
    expect(parseDurationToMicroseconds(0)).toBeNull();
    expect(parseDurationToMicroseconds(-1)).toBeNull();
  });

  it('keeps the unit explicit', () => {
    expect(MICROSECONDS_PER_SECOND).toBe(1_000_000);
  });
});

describe('formatDurationUs', () => {
  it('formats lap times and runtime in motorsport notation', () => {
    expect(formatDurationUs(83_456_000)).toBe('1:23.456');
    expect(formatDurationUs(754_567_000)).toBe('12:34.567');
    expect(formatDurationUs(3_754_567_000)).toBe('1:02:34.567');
  });

  it('formats missing durations and runtime gaps', () => {
    expect(formatDurationUs(null)).toBe('—');
    expect(formatGapUs(0)).toBe('—');
    expect(formatGapUs(3_000_000)).toBe('+0:03.000');
  });
});
