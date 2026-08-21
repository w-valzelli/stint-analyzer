import type { Lap } from '../model/normalized';
import type { LapEligibility } from '../model/scope';
import { paceEligibleLaps } from './laps';
import { numericStats, type NullableNumericStats } from './statistics';

export type SectorStatsEntry = {
  driver: string;
  sector: string;
  stats: NullableNumericStats;
};

export type SectorBenchmark = {
  sector: string;
  bestSingleUs: number | null;
  bestMeanUs: number | null;
  bestMedianUs: number | null;
};

export type SectorGapEntry = SectorStatsEntry & {
  gapToBestSingleUs: number | null;
  gapToBestMeanUs: number | null;
  gapToBestMedianUs: number | null;
};

export type DriverTheoreticalBest = {
  driver: string;
  bestActualUs: number | null;
  theoreticalBestUs: number | null;
  executionGapUs: number | null;
};

function compareSectorNames(left: string, right: string): number {
  const leftMatch = left.match(/(\d+)$/);
  const rightMatch = right.match(/(\d+)$/);
  if (leftMatch && rightMatch) {
    return Number(leftMatch[1]) - Number(rightMatch[1]) || left.localeCompare(right);
  }
  if (leftMatch) {
    return -1;
  }
  if (rightMatch) {
    return 1;
  }
  return left.localeCompare(right);
}

function compareDrivers(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

export function sectorNamesForLaps(laps: readonly Lap[]): string[] {
  return [...new Set(laps.flatMap((lap) => Object.keys(lap.sectorsUs)))].sort(compareSectorNames);
}

export function calculateSectorStats(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
): SectorStatsEntry[] {
  const sectors = sectorNamesForLaps(laps);
  const drivers = [...new Set(laps.map((lap) => lap.driver))].sort(compareDrivers);

  return drivers.flatMap((driver) => {
    const driverLaps = laps.filter((lap) => lap.driver === driver);
    const driverEligibility = eligibility.filter((item) => item.driver === driver);
    const paceLaps = paceEligibleLaps(driverLaps, driverEligibility);

    return sectors.map((sector) => ({
      driver,
      sector,
      stats: numericStats(
        paceLaps.flatMap((lap) => {
          const value = lap.sectorsUs[sector];
          return value === null || value === undefined ? [] : [value];
        }),
      ),
    }));
  });
}

export function calculateSectorBenchmarks(entries: readonly SectorStatsEntry[]): SectorBenchmark[] {
  const sectors = [...new Set(entries.map((entry) => entry.sector))].sort(compareSectorNames);

  return sectors.map((sector) => {
    const sectorEntries = entries.filter((entry) => entry.sector === sector);
    const minimum = (values: readonly (number | null)[]): number | null => {
      const available = values.filter((value): value is number => value !== null);
      return available.length === 0 ? null : Math.min(...available);
    };

    return {
      sector,
      bestSingleUs: minimum(sectorEntries.map((entry) => entry.stats.best)),
      bestMeanUs: minimum(sectorEntries.map((entry) => entry.stats.mean)),
      bestMedianUs: minimum(sectorEntries.map((entry) => entry.stats.median)),
    };
  });
}

function gapToBenchmark(value: number | null, benchmark: number | null): number | null {
  if (value === null || benchmark === null) {
    return null;
  }
  return Math.max(0, value - benchmark);
}

export function calculateSectorGaps(
  entries: readonly SectorStatsEntry[],
  benchmarks: readonly SectorBenchmark[] = calculateSectorBenchmarks(entries),
): SectorGapEntry[] {
  const benchmarksBySector = new Map(benchmarks.map((benchmark) => [benchmark.sector, benchmark]));

  return entries.map((entry) => {
    const benchmark = benchmarksBySector.get(entry.sector);
    return {
      ...entry,
      gapToBestSingleUs: gapToBenchmark(entry.stats.best, benchmark?.bestSingleUs ?? null),
      gapToBestMeanUs: gapToBenchmark(entry.stats.mean, benchmark?.bestMeanUs ?? null),
      gapToBestMedianUs: gapToBenchmark(entry.stats.median, benchmark?.bestMedianUs ?? null),
    };
  });
}

export function calculateTheoreticalBests(
  entries: readonly SectorStatsEntry[],
  lapAnalyses: readonly { driver: string; lapStats: NullableNumericStats }[],
  sectors: readonly string[] = [...new Set(entries.map((entry) => entry.sector))].sort(
    compareSectorNames,
  ),
): DriverTheoreticalBest[] {
  const drivers = [...new Set(lapAnalyses.map((analysis) => analysis.driver))].sort(compareDrivers);
  const entriesByDriver = new Map<string, SectorStatsEntry[]>(
    drivers.map((driver) => [driver, entries.filter((entry) => entry.driver === driver)]),
  );

  return drivers.map((driver) => {
    const driverEntries = entriesByDriver.get(driver) ?? [];
    const bestSectors = sectors.map(
      (sector) => driverEntries.find((entry) => entry.sector === sector)?.stats.best ?? null,
    );
    const theoreticalBestUs = bestSectors.every((value) => value !== null)
      ? bestSectors.reduce((total, value) => total + (value ?? 0), 0)
      : null;
    const bestActualUs =
      lapAnalyses.find((analysis) => analysis.driver === driver)?.lapStats.best ?? null;

    return {
      driver,
      bestActualUs,
      theoreticalBestUs,
      executionGapUs:
        bestActualUs === null || theoreticalBestUs === null
          ? null
          : Math.max(0, bestActualUs - theoreticalBestUs),
    };
  });
}
