import type { Lap } from './normalized';

export const paceModes = ['clean-non-pit', 'all-non-pit'] as const;
export type PaceMode = (typeof paceModes)[number];

export type SourceScopeGroup = {
  scopeKey: string;
  sourceFileId: string;
  sourceFileName: string;
  driver: string;
  laps: readonly Lap[];
};

export type CandidateStint = {
  id: string;
  sourceScopeKey: string;
  driverScopeKey: string;
  sourceFileId: string;
  sourceFileName: string;
  driver: string;
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

export type DriverScopeGroup = {
  scopeKey: string;
  driver: string;
  laps: readonly Lap[];
  stints: readonly CandidateStint[];
};

export type ScopeSelection = {
  scopeKey: string;
  selectedStintIds: readonly string[];
};

export type EligibilityReason =
  | 'scope-not-configured'
  | 'stint-not-selected'
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
  stintId: string | null;
  runtime: EligibilityState;
  pace: EligibilityState;
};

export function scopeKeyFor(sourceFileId: string, driver: string): string {
  return JSON.stringify([sourceFileId, driver]);
}

export function driverScopeKeyFor(driver: string): string {
  return JSON.stringify([driver]);
}

export function scopeKeyForLap(lap: Pick<Lap, 'sourceFileId' | 'driver'>): string {
  return scopeKeyFor(lap.sourceFileId, lap.driver);
}

export function driverScopeKeyForLap(lap: Pick<Lap, 'driver'>): string {
  return driverScopeKeyFor(lap.driver);
}
