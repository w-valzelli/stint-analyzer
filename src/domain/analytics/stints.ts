import type { Lap } from '../model/normalized';
import {
  driverScopeKeyFor,
  scopeKeyForLap,
  type CandidateStint,
  type DriverScopeGroup,
  type ScopeSelection,
  type SourceScopeGroup,
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

export function groupLapsByScope(laps: readonly Lap[]): SourceScopeGroup[] {
  const groups = new Map<string, SourceScopeGroup>();

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

  const runChanged = previous.run !== null && current.run !== null && previous.run !== current.run;
  const lapNumberReset =
    previous.lapNumber !== null &&
    current.lapNumber !== null &&
    previous.lapNumber > 0 &&
    current.lapNumber > 0 &&
    current.lapNumber < previous.lapNumber;

  return runChanged || current.pitOut || previous.pitIn || lapNumberReset;
}

function buildCandidateStint(
  group: SourceScopeGroup,
  index: number,
  laps: readonly Lap[],
): CandidateStint {
  const firstFullTimedLap = laps.find((lap) => lap.isFullTimedLap);
  const lastFullTimedLap = [...laps].reverse().find((lap) => lap.isFullTimedLap);
  const outLap = laps.find((lap) => lap.pitOut);
  const inLap = [...laps].reverse().find((lap) => lap.pitIn);

  return {
    id: `${group.scopeKey}:stint-${index + 1}`,
    sourceScopeKey: group.scopeKey,
    driverScopeKey: driverScopeKeyFor(group.driver),
    sourceFileId: group.sourceFileId,
    sourceFileName: group.sourceFileName,
    driver: group.driver,
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

export function detectCandidateStints(group: SourceScopeGroup): CandidateStint[] {
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

  return candidates.map((laps, index) => buildCandidateStint(group, index, laps));
}

export function detectStints(laps: readonly Lap[]): CandidateStint[] {
  return groupLapsByScope(laps).flatMap((group) => detectCandidateStints(group));
}

export function groupLapsByDriver(laps: readonly Lap[]): DriverScopeGroup[] {
  const groups = new Map<string, DriverScopeGroup>();

  for (const sourceGroup of groupLapsByScope(laps)) {
    const driverScopeKey = driverScopeKeyFor(sourceGroup.driver);
    const existing = groups.get(driverScopeKey);
    const sourceStints = detectCandidateStints(sourceGroup);

    if (existing) {
      existing.laps = [...existing.laps, ...sourceGroup.laps];
      existing.stints = [...existing.stints, ...sourceStints];
      continue;
    }

    groups.set(driverScopeKey, {
      scopeKey: driverScopeKey,
      driver: sourceGroup.driver,
      laps: [...sourceGroup.laps],
      stints: sourceStints,
    });
  }

  return [...groups.values()].sort((left, right) => compareText(left.driver, right.driver));
}

function defaultStintIds(stints: readonly CandidateStint[]): string[] {
  return stints
    .filter((stint) => stint.fullTimedLapCount > 0)
    .map((stint) => stint.id);
}

export function createDefaultScopeSelections(laps: readonly Lap[]): ScopeSelection[] {
  return groupLapsByDriver(laps).map((group) => ({
    scopeKey: group.scopeKey,
    selectedStintIds: defaultStintIds(group.stints),
  }));
}

export function reconcileScopeSelections(
  laps: readonly Lap[],
  previousSelections: readonly ScopeSelection[],
): ScopeSelection[] {
  const previousByKey = new Map(
    previousSelections.map((selection) => [selection.scopeKey, selection]),
  );

  return groupLapsByDriver(laps).map((group) => {
    const previous = previousByKey.get(group.scopeKey);
    const availableStintIds = new Set(
      group.stints.filter((stint) => stint.fullTimedLapCount > 0).map((stint) => stint.id),
    );
    const selectedStintIds = previous
      ? previous.selectedStintIds.filter((stintId) => availableStintIds.has(stintId))
      : defaultStintIds(group.stints);

    return {
      scopeKey: group.scopeKey,
      selectedStintIds,
    };
  });
}
