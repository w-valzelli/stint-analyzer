const MILLISECONDS_PER_SECOND = 1_000;

export const MICROSECONDS_PER_SECOND = 1_000_000;
export const MICROSECONDS_PER_DAY = 86_400 * MICROSECONDS_PER_SECOND;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function padMilliseconds(value: number): string {
  return String(value).padStart(3, '0');
}

export function microsecondsToSeconds(value: number | null):
number | null {
  return value === null ? null : value / MICROSECONDS_PER_SECOND;
}

export function formatDurationUs(valueUs: number | null):
string {
  if (valueUs === null){
    return '—';
  }

  const sign = valueUs < 0 ? '-' : '';

  const totalMilliseconds = Math.round(
    Math.abs(valueUs) / (MICROSECONDS_PER_SECOND / MILLISECONDS_PER_SECOND)
  );
  const milliseconds = totalMilliseconds % MILLISECONDS_PER_SECOND;

  const totalSeconds = Math.floor(totalMilliseconds / MILLISECONDS_PER_SECOND);
  const seconds = totalSeconds % 60;

  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;

  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0){
    return `${sign}${hours}:${pad(minutes)}:${pad(seconds)}.${padMilliseconds(milliseconds)}`;
  }

  return `${sign}${totalMinutes}:${pad(seconds)}.${padMilliseconds(milliseconds)}`;
}
