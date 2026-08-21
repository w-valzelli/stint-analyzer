import type { Lap } from '../model/normalized';
import type { CandidateStint, LapEligibility } from '../model/scope';
import { numericStats } from './statistics';
import type { SectorStatsEntry } from './sectors';

export type StintProgressionLap = {
  stintId: string;
  driver: string;
  lapId: string;
  lapIndex: number;
  lapNumber: number | null;
  lapTimeUs: number;
  deltaToStintMedianUs: number;
  sectorDeltaUs: Record<string, number | null>;
  fuelLevel: number | null;
};

export type StintProgression = {
  stintId: string;
  driver: string;
  sourceFileId: string;
  sourceFileName: string;
  medianLapUs: number | null;
  laps: StintProgressionLap[];
};

function compareProgression(left: CandidateStint, right: CandidateStint): number {
  return (
    left.driver.localeCompare(right.driver, undefined, { sensitivity: 'base' }) ||
    left.sourceFileName.localeCompare(right.sourceFileName, undefined, { sensitivity: 'base' }) ||
    left.index - right.index ||
    left.id.localeCompare(right.id)
  );
}

function selectedStint(stint: CandidateStint, eligibility: readonly LapEligibility[]): boolean {
  return eligibility.some((item) => item.stintId === stint.id && item.runtime.eligible);
}

export function calculateStintProgression(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
  stints: readonly CandidateStint[],
  sectorStats: readonly SectorStatsEntry[],
): StintProgression[] {
  const lapsById = new Map(laps.map((lap) => [lap.id, lap]));
  const eligibilityById = new Map(eligibility.map((item) => [item.lapId, item]));
  const sectorOrder = [...new Set(sectorStats.map((entry) => entry.sector))];
  const sectorMediansByDriver = new Map<string, Map<string, number>>();

  for (const entry of sectorStats) {
    const median = entry.stats.median;
    if (median === null) {
      continue;
    }
    const driverMedians = sectorMediansByDriver.get(entry.driver) ?? new Map<string, number>();
    driverMedians.set(entry.sector, median);
    sectorMediansByDriver.set(entry.driver, driverMedians);
  }

  return [...stints]
    .filter((stint) => selectedStint(stint, eligibility))
    .sort(compareProgression)
    .map((stint) => {
      const paceLaps = stint.lapIds.flatMap((lapId) => {
        const lap = lapsById.get(lapId);
        const result = eligibilityById.get(lapId);
        return lap && result?.pace.eligible && lap.lapTimeUs !== null ? [lap] : [];
      });
      const lapStats = numericStats(
        paceLaps.flatMap((lap) => (lap.lapTimeUs === null ? [] : [lap.lapTimeUs])),
      );
      const driverMedians = sectorMediansByDriver.get(stint.driver) ?? new Map();

      return {
        stintId: stint.id,
        driver: stint.driver,
        sourceFileId: stint.sourceFileId,
        sourceFileName: stint.sourceFileName,
        medianLapUs: lapStats.median,
        laps: paceLaps.map((lap, index) => ({
          stintId: stint.id,
          driver: stint.driver,
          lapId: lap.id,
          lapIndex: index + 1,
          lapNumber: lap.lapNumber,
          lapTimeUs: lap.lapTimeUs as number,
          deltaToStintMedianUs:
            lapStats.median === null ? 0 : (lap.lapTimeUs as number) - lapStats.median,
          sectorDeltaUs: Object.fromEntries(
            sectorOrder.map((sector) => {
              const value = lap.sectorsUs[sector] ?? null;
              return [
                sector,
                value === null || !driverMedians.has(sector)
                  ? null
                  : value - (driverMedians.get(sector) as number),
              ];
            }),
          ),
          fuelLevel: lap.fuelLevel,
        })),
      };
    });
}
