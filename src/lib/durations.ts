import { MICROSECONDS_PER_SECOND } from '../domain/parsing/durations';

const MILLISECONDS_PER_SECOND = 1_000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function padMilliseconds(value: number): string {
  return String(value).padStart(3, '0');
}

export function formatDurationUs(valueUs: number | null): string {
  if (valueUs === null) {
    return '—';
  }

  const totalMilliseconds = Math.round(
    valueUs / (MICROSECONDS_PER_SECOND / MILLISECONDS_PER_SECOND),
  );
  const milliseconds = totalMilliseconds % MILLISECONDS_PER_SECOND;
  const totalSeconds = Math.floor(totalMilliseconds / MILLISECONDS_PER_SECOND);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}.${padMilliseconds(milliseconds)}`;
  }

  return `${totalMinutes}:${pad(seconds)}.${padMilliseconds(milliseconds)}`;
}

export function formatGapUs(valueUs: number): string {
  return valueUs === 0 ? '—' : `+${formatDurationUs(valueUs)}`;
}
