import type { Lap } from './normalized';

export const paceModes = ['clean-non-pit', 'all-non-pit'] as const;
export type PaceMode = (typeof paceModes)[number];

export type ScopeGroup = {
  scopeKey: string;
  sourceFileId: string;
  sourceFileName: string;
  driver: string;
  laps: readonly Lap[];
};

export type CandidateStint = {
  id: string;
  scopeKey: string;
  index: number;
  lapIds: readonly string[];
  firstLapId: string | null;
  lastLapId: string | null;
  firstFullTimedLapId: string | null;
  lastFullTimedLapId: string | null;
  outLapId: string | null;
  inLapId: string | null;
  lapCount: number;
  fullTimedLapCount: number;
};

export type ScopeSelection = {
  scopeKey: string;
  included: boolean;
  selectedStintId: string | null;
  startLapId: string | null;
  endLapId: string | null;
  paceMode: PaceMode;
};

export type EligibilityReason =
  | 'scope-not-configured'
  | 'scope-excluded'
  | 'no-stint-selected'
  | 'outside-selected-stint'
  | 'lap-bounds-unset'
  | 'outside-lap-bounds'
  | 'not-full-timed'
  | 'lap-time-unavailable'
  | 'pit-in'
  | 'pit-out'
  | 'clean-false'
  | 'clean-status-unavailable';

export type EligibilityState = {
  eligible: boolean;
  reasons: readonly EligibilityReason[];
};

export type LapEligibility = {
  lapId: string;
  scopeKey: string;
  sourceFileId: string;
  sourceFileName: string;
  driver: string;
  rowNumber: number;
  lapNumber: number | null;
  runtime: EligibilityState;
  pace: EligibilityState;
};

export function scopeKeyFor(sourceFileId: string, driver: string): string {
  return JSON.stringify([sourceFileId, driver]);
}

export function scopeKeyForLap(lap: Pick<Lap, 'sourceFileId' | 'driver'>): string {
  return scopeKeyFor(lap.sourceFileId, lap.driver);
}
