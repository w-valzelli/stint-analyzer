import type { Lap } from '../model/normalized';
import {
  scopeKeyForLap,
  type CandidateStint,
  type EligibilityReason,
  type EligibilityState,
  type LapEligibility,
  type ScopeSelection,
} from '../model/scope';

function state(reasons: EligibilityReason[]): EligibilityState {
  return { eligible: reasons.length === 0, reasons };
}

function uniqueReasons(reasons: EligibilityReason[]): EligibilityReason[] {
  return [...new Set(reasons)];
}

function selectedStintFor(
  selection: ScopeSelection | undefined,
  stints: readonly CandidateStint[],
): CandidateStint | null {
  if (!selection?.selectedStintId) {
    return null;
  }
  return stints.find((stint) => stint.id === selection.selectedStintId) ?? null;
}

function boundIndexes(
  stint: CandidateStint,
  selection: ScopeSelection,
): { start: number; end: number } | null {
  if (!selection.startLapId || !selection.endLapId) {
    return null;
  }

  const start = stint.lapIds.indexOf(selection.startLapId);
  const end = stint.lapIds.indexOf(selection.endLapId);
  if (start < 0 || end < 0 || start > end) {
    return null;
  }

  return { start, end };
}

function scopeReasons(
  lap: Lap,
  selection: ScopeSelection | undefined,
  stint: CandidateStint | null,
): EligibilityReason[] {
  if (!selection) {
    return ['scope-not-configured'];
  }
  if (!selection.included) {
    return ['scope-excluded'];
  }
  if (!stint) {
    return ['no-stint-selected'];
  }
  if (!stint.lapIds.includes(lap.id)) {
    return ['outside-selected-stint'];
  }

  const bounds = boundIndexes(stint, selection);
  if (!bounds) {
    return ['lap-bounds-unset'];
  }

  const lapIndex = stint.lapIds.indexOf(lap.id);
  if (lapIndex < bounds.start || lapIndex > bounds.end) {
    return ['outside-lap-bounds'];
  }

  return [];
}

function runtimeState(lap: Lap, reasons: EligibilityReason[]): EligibilityState {
  const nextReasons = [...reasons];
  if (nextReasons.length === 0 && !lap.isFullTimedLap) {
    nextReasons.push('not-full-timed');
  }
  if (nextReasons.length === 0 && lap.lapTimeUs === null) {
    nextReasons.push('lap-time-unavailable');
  }
  return state(uniqueReasons(nextReasons));
}

function paceState(
  lap: Lap,
  reasons: EligibilityReason[],
  paceMode: ScopeSelection['paceMode'] | undefined,
): EligibilityState {
  const nextReasons = [...reasons];
  if (nextReasons.length === 0 && !lap.isFullTimedLap) {
    nextReasons.push('not-full-timed');
  }
  if (nextReasons.length === 0 && lap.lapTimeUs === null) {
    nextReasons.push('lap-time-unavailable');
  }
  if (nextReasons.length === 0 && lap.pitIn) {
    nextReasons.push('pit-in');
  }
  if (nextReasons.length === 0 && lap.pitOut) {
    nextReasons.push('pit-out');
  }
  if (nextReasons.length === 0 && paceMode === 'clean-non-pit' && lap.clean === false) {
    nextReasons.push('clean-false');
  }
  if (nextReasons.length === 0 && paceMode === 'clean-non-pit' && lap.clean === null) {
    nextReasons.push('clean-status-unavailable');
  }
  return state(uniqueReasons(nextReasons));
}

export function deriveLapEligibility(
  laps: readonly Lap[],
  selections: readonly ScopeSelection[],
  stints: readonly CandidateStint[],
): LapEligibility[] {
  const selectionsByKey = new Map(selections.map((selection) => [selection.scopeKey, selection]));
  const stintsByKey = new Map<string, CandidateStint[]>();

  for (const stint of stints) {
    const groupStints = stintsByKey.get(stint.scopeKey) ?? [];
    groupStints.push(stint);
    stintsByKey.set(stint.scopeKey, groupStints);
  }

  return laps.map((lap) => {
    const scopeKey = scopeKeyForLap(lap);
    const selection = selectionsByKey.get(scopeKey);
    const selectedStint = selectedStintFor(selection, stintsByKey.get(scopeKey) ?? []);
    const reasons = scopeReasons(lap, selection, selectedStint);

    return {
      lapId: lap.id,
      scopeKey,
      sourceFileId: lap.sourceFileId,
      sourceFileName: lap.sourceFileName,
      driver: lap.driver,
      rowNumber: lap.rowNumber,
      lapNumber: lap.lapNumber,
      runtime: runtimeState(lap, reasons),
      pace: paceState(lap, reasons, selection?.paceMode),
    };
  });
}
