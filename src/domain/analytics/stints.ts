import type { Lap } from '../model/normalized';
import {
  scopeKeyForLap,
  type CandidateStint,
  type ScopeGroup,
  type ScopeSelection,
} from '../model/scope';

function parsedTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function orderLaps(laps: readonly Lap[]): Lap[] {
  const timestamps = laps.map((lap) => parsedTimestamp(lap.startedAt));
  const hasCompleteTimestamps = laps.length > 0 && timestamps.every((value) => value !== null);

  if (!hasCompleteTimestamps) {
    return [...laps];
  }

  return laps
    .map((lap, index) => ({ lap, index, timestamp: timestamps[index] as number }))
    .sort(
      (left, right) =>
        left.timestamp - right.timestamp ||
        left.lap.rowNumber - right.lap.rowNumber ||
        left.index - right.index,
    )
    .map(({ lap }) => lap);
}

export function groupLapsByScope(laps: readonly Lap[]): ScopeGroup[] {
  const groups = new Map<string, ScopeGroup>();

  for (const lap of laps) {
    const scopeKey = scopeKeyForLap(lap);
    const existing = groups.get(scopeKey);
    if (existing) {
      existing.laps = [...existing.laps, lap];
      continue;
    }

    groups.set(scopeKey, {
      scopeKey,
      sourceFileId: lap.sourceFileId,
      sourceFileName: lap.sourceFileName,
      driver: lap.driver,
      laps: [lap],
    });
  }

  return [...groups.values()]
    .map((group) => ({ ...group, laps: orderLaps(group.laps) }))
    .sort(
      (left, right) =>
        compareText(left.sourceFileName, right.sourceFileName) ||
        compareText(left.driver, right.driver) ||
        compareText(left.scopeKey, right.scopeKey),
    );
}

function startsNewStint(previous: Lap | undefined, current: Lap): boolean {
  if (!previous) {
    return false;
  }

  const runChanged =
    previous.run !== null && current.run !== null && previous.run !== current.run;
  const lapNumberReset =
    previous.lapNumber !== null &&
    current.lapNumber !== null &&
    previous.lapNumber > 0 &&
    current.lapNumber > 0 &&
    current.lapNumber < previous.lapNumber;

  return runChanged || current.pitOut || previous.pitIn || lapNumberReset;
}

function buildCandidateStint(scopeKey: string, index: number, laps: readonly Lap[]): CandidateStint {
  const firstFullTimedLap = laps.find((lap) => lap.isFullTimedLap);
  const lastFullTimedLap = [...laps].reverse().find((lap) => lap.isFullTimedLap);
  const outLap = laps.find((lap) => lap.pitOut);
  const inLap = [...laps].reverse().find((lap) => lap.pitIn);

  return {
    id: `${scopeKey}:stint-${index + 1}`,
    scopeKey,
    index,
    lapIds: laps.map((lap) => lap.id),
    firstLapId: laps[0]?.id ?? null,
    lastLapId: laps.at(-1)?.id ?? null,
    firstFullTimedLapId: firstFullTimedLap?.id ?? null,
    lastFullTimedLapId: lastFullTimedLap?.id ?? null,
    outLapId: outLap?.id ?? null,
    inLapId: inLap?.id ?? null,
    lapCount: laps.length,
    fullTimedLapCount: laps.filter((lap) => lap.isFullTimedLap).length,
  };
}

export function detectCandidateStints(group: ScopeGroup): CandidateStint[] {
  const candidates: Lap[][] = [];

  for (const lap of group.laps) {
    const current = candidates.at(-1);
    const previous = current?.at(-1);
    if (!current || startsNewStint(previous, lap)) {
      candidates.push([lap]);
    } else {
      current.push(lap);
    }
  }

  return candidates.map((laps, index) => buildCandidateStint(group.scopeKey, index, laps));
}

export function detectStints(laps: readonly Lap[]): CandidateStint[] {
  return groupLapsByScope(laps).flatMap((group) => detectCandidateStints(group));
}

function defaultStint(stints: readonly CandidateStint[]): CandidateStint | null {
  return (
    [...stints].sort(
      (left, right) => right.fullTimedLapCount - left.fullTimedLapCount || left.index - right.index,
    )[0] ?? null
  );
}

export function createDefaultScopeSelections(laps: readonly Lap[]): ScopeSelection[] {
  return groupLapsByScope(laps).map((group) => {
    const stint = defaultStint(detectCandidateStints(group));
    return {
      scopeKey: group.scopeKey,
      included: true,
      selectedStintId: stint?.id ?? null,
      startLapId: stint?.firstFullTimedLapId ?? null,
      endLapId: stint?.lastFullTimedLapId ?? null,
      paceMode: 'clean-non-pit',
    };
  });
}
