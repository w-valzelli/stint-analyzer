import type { Lap } from '../model/normalized';
import {
  driverScopeKeyForLap,
  type CandidateStint,
  type EligibilityReason,
  type EligibilityState,
  type LapEligibility,
  type PaceMode,
  type ScopeSelection,
} from '../model/scope';

function state(reasons: EligibilityReason[]): EligibilityState {
  return { eligible: reasons.length === 0, reasons };
}

function uniqueReasons(reasons: EligibilityReason[]): EligibilityReason[] {
  return [...new Set(reasons)];
}

function inherentReasons(lap: Lap): EligibilityReason[] {
  const reasons: EligibilityReason[] = [];
  if (!lap.isFullTimedLap) {
    reasons.push('not-full-timed');
  }
  if (lap.lapTimeUs === null) {
    reasons.push('lap-time-unavailable');
  }
  return reasons;
}

function selectionReasons(
  selection: ScopeSelection | undefined,
  candidate: CandidateStint | undefined,
): EligibilityReason[] {
  if (!selection) {
    return ['scope-not-configured'];
  }
  if (!candidate || !selection.selectedStintIds.includes(candidate.id)) {
    return ['stint-not-selected'];
  }
  return [];
}

function runtimeState(reasons: EligibilityReason[]): EligibilityState {
  return state(uniqueReasons(reasons));
}

function paceState(lap: Lap, reasons: EligibilityReason[], paceMode: PaceMode): EligibilityState {
  const nextReasons = [...reasons];
  if (lap.pitIn) {
    nextReasons.push('pit-in');
  }
  if (lap.pitOut) {
    nextReasons.push('pit-out');
  }
  if (paceMode === 'clean-non-pit' && lap.clean === false) {
    nextReasons.push('clean-false');
  }
  if (paceMode === 'clean-non-pit' && lap.clean === null) {
    nextReasons.push('clean-status-unavailable');
  }
  return state(uniqueReasons(nextReasons));
}

export function deriveLapEligibility(
  laps: readonly Lap[],
  selections: readonly ScopeSelection[],
  stints: readonly CandidateStint[],
  paceMode: PaceMode,
): LapEligibility[] {
  const selectionsByKey = new Map(selections.map((selection) => [selection.scopeKey, selection]));
  const stintsByLapId = new Map<string, CandidateStint>();

  for (const stint of stints) {
    for (const lapId of stint.lapIds) {
      stintsByLapId.set(lapId, stint);
    }
  }

  return laps.map((lap) => {
    const scopeKey = driverScopeKeyForLap(lap);
    const selection = selectionsByKey.get(scopeKey);
    const candidate = stintsByLapId.get(lap.id);
    const reasons = [...inherentReasons(lap), ...selectionReasons(selection, candidate)];

    return {
      lapId: lap.id,
      scopeKey,
      sourceFileId: lap.sourceFileId,
      sourceFileName: lap.sourceFileName,
      driver: lap.driver,
      rowNumber: lap.rowNumber,
      lapNumber: lap.lapNumber,
      stintId: candidate?.id ?? null,
      runtime: runtimeState(reasons),
      pace: paceState(lap, reasons, paceMode),
    };
  });
}
