export const MICROSECONDS_PER_SECOND = 1_000_000;
export const MICROSECONDS_PER_DAY = 86_400 * MICROSECONDS_PER_SECOND;

function parseClockDuration(value: string): number | null {
  const parts = value.split(':').map((part) => Number(part.trim()));

  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const seconds =
    parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3_600 + parts[1] * 60 + parts[2];

  return seconds > 0 ? Math.round(seconds * MICROSECONDS_PER_SECOND) : null;
}

function parseNumericDuration(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const seconds = value < 2 ? value * 86_400 : value;
  return Math.round(seconds * MICROSECONDS_PER_SECOND);
}

export function parseDurationToMicroseconds(value: unknown): number | null {
  if (typeof value === 'number') {
    return parseNumericDuration(value);
  }

  if (value instanceof Date) {
    const seconds =
      value.getUTCHours() * 3_600 +
      value.getUTCMinutes() * 60 +
      value.getUTCSeconds() +
      value.getUTCMilliseconds() / 1_000;
    return seconds > 0 ? Math.round(seconds * MICROSECONDS_PER_SECOND) : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.includes(':')) {
    return parseClockDuration(normalized);
  }

  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? parseNumericDuration(numericValue) : null;
}

export function microsecondsToSeconds(value: number | null): number | null {
  return value === null ? null : value / MICROSECONDS_PER_SECOND;
}
