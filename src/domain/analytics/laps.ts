import type { Lap } from '../model/normalized';
import type { LapEligibility } from '../model/scope';
import { durationStats, type NullableNumericStats } from './statistics';

export type CleanLapPercentage = {
  cleanCount: number;
  eligibleNonPitCount: number;
  percentage: number | null;
};

export type DriverLapAnalysis = {
  driver: string;
  runtimeLaps: number;
  paceLaps: number;
  runtimeUs: number;
  lapStats: NullableNumericStats;
  cleanPercentage: CleanLapPercentage;
};

function eligibilityByLapId(
  eligibility: readonly LapEligibility[],
): ReadonlyMap<string, LapEligibility> {
  return new Map(eligibility.map((item) => [item.lapId, item]));
}

function eligibleLaps(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
  kind: 'runtime' | 'pace',
): Lap[] {
  const eligibilityById = eligibilityByLapId(eligibility);
  return laps.filter((lap) => {
    const result = eligibilityById.get(lap.id);
    return result?.[kind].eligible && lap.lapTimeUs !== null;
  });
}

export function runtimeEligibleLaps(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
): Lap[] {
  return eligibleLaps(laps, eligibility, 'runtime');
}

export function paceEligibleLaps(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
): Lap[] {
  return eligibleLaps(laps, eligibility, 'pace');
}

export function sumRuntimeUs(laps: readonly Lap[], eligibility: readonly LapEligibility[]): number {
  return runtimeEligibleLaps(laps, eligibility).reduce(
    (total, lap) => total + (lap.lapTimeUs ?? 0),
    0,
  );
}

export function cleanLapPercentage(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
): CleanLapPercentage {
  const eligibleNonPitLaps = runtimeEligibleLaps(laps, eligibility).filter(
    (lap) => !lap.pitIn && !lap.pitOut,
  );
  const cleanCount = eligibleNonPitLaps.filter((lap) => lap.clean === true).length;

  return {
    cleanCount,
    eligibleNonPitCount: eligibleNonPitLaps.length,
    percentage:
      eligibleNonPitLaps.length === 0 ? null : (cleanCount / eligibleNonPitLaps.length) * 100,
  };
}

export function lapTimeStats(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
): NullableNumericStats {
  return durationStats(
    paceEligibleLaps(laps, eligibility).flatMap((lap) =>
      lap.lapTimeUs === null ? [] : [lap.lapTimeUs],
    ),
  );
}

export function driverLapAnalyses(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
): DriverLapAnalysis[] {
  const drivers = [...new Set(laps.map((lap) => lap.driver))].sort((left, right) =>
    left.localeCompare(right),
  );

  return drivers.map((driver) => {
    const driverLaps = laps.filter((lap) => lap.driver === driver);
    const driverEligibility = eligibility.filter((item) => item.driver === driver);
    const runtime = runtimeEligibleLaps(driverLaps, driverEligibility);
    const pace = paceEligibleLaps(driverLaps, driverEligibility);

    return {
      driver,
      runtimeLaps: runtime.length,
      paceLaps: pace.length,
      runtimeUs: runtime.reduce((total, lap) => total + (lap.lapTimeUs ?? 0), 0),
      lapStats: lapTimeStats(driverLaps, driverEligibility),
      cleanPercentage: cleanLapPercentage(driverLaps, driverEligibility),
    };
  });
}
