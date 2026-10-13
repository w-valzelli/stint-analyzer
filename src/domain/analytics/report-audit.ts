import type { Lap } from '../model/normalized';
import type { LapAuditRow, StintAnalysis } from '../model/report';
import type { CandidateStint, LapEligibility } from '../model/scope';
import { paceEligibleLaps, runtimeEligibleLaps } from './laps';
import type { SectorStatsEntry } from './sectors';
import { calculateStintPaceProgression } from './stint-pace-progression';
import { compareText } from './text-order';

export type AuditReportInput = {
  laps: readonly Lap[];
  eligibility: readonly LapEligibility[];
  stints: readonly CandidateStint[];
  sectorEntries: readonly SectorStatsEntry[];
};

export type AuditReportSections = {
  stints: StintAnalysis[];
  lapAudit: LapAuditRow[];
};

function buildStintAnalyses({
  laps,
  eligibility,
  stints,
  sectorEntries,
}: AuditReportInput): StintAnalysis[] {
  const progression = calculateStintPaceProgression(laps, eligibility, stints, sectorEntries);
  const stintsById = new Map(stints.map((stint) => [stint.id, stint]));
  const lapsById = new Map(laps.map((lap) => [lap.id, lap]));

  return progression.map((entry) => {
    const stint = stintsById.get(entry.stintId);
    if (!stint) {
      throw new Error(`Stint ${entry.stintId} is missing from the candidate list.`);
    }
    const stintLaps = stint.lapIds.flatMap((lapId) => {
      const lap = lapsById.get(lapId);
      return lap ? [lap] : [];
    });
    const runtimeLaps = runtimeEligibleLaps(stintLaps, eligibility).length;
    const paceLaps = paceEligibleLaps(stintLaps, eligibility).length;

    return {
      stintId: entry.stintId,
      driver: entry.driver,
      sourceFileId: entry.sourceFileId,
      sourceFileName: entry.sourceFileName,
      index: stint.index,
      firstLapId: stint.firstLapId,
      lastLapId: stint.lastLapId,
      outLapId: stint.outLapId,
      inLapId: stint.inLapId,
      lapCount: stint.lapCount,
      fullTimedLapCount: stint.fullTimedLapCount,
      runtimeLapCount: runtimeLaps,
      paceLapCount: paceLaps,
      runtimeUs: runtimeEligibleLaps(stintLaps, eligibility).reduce(
        (total, lap) => total + (lap.lapTimeUs ?? 0),
        0,
      ),
      medianLapUs: entry.medianLapUs,
      progression: entry.laps.map((lap) => ({
        lapId: lap.lapId,
        lapIndex: lap.lapIndex,
        lapNumber: lap.lapNumber,
        lapTimeUs: lap.lapTimeUs,
        deltaToStintMedianUs: lap.deltaToStintMedianUs,
        sectorDeltaUs: lap.sectorDeltaUs,
        fuelLevel: lap.fuelLevel,
      })),
    };
  });
}

function buildLapAudit(
  laps: readonly Lap[],
  eligibility: readonly LapEligibility[],
): LapAuditRow[] {
  const eligibilityById = new Map(eligibility.map((item) => [item.lapId, item]));

  return laps
    .flatMap((lap) => {
      const result = eligibilityById.get(lap.id);
      if (!result) {
        return [];
      }
      const exclusionReasons = result.runtime.eligible
        ? result.pace.reasons
        : result.runtime.reasons;

      return [
        {
          id: lap.id,
          sourceFileId: lap.sourceFileId,
          sourceFileName: lap.sourceFileName,
          rowNumber: lap.rowNumber,
          driver: lap.driver,
          run: lap.run,
          lapNumber: lap.lapNumber,
          lapTimeUs: lap.lapTimeUs,
          sectorsUs: lap.sectorsUs,
          clean: lap.clean,
          pitIn: lap.pitIn,
          pitOut: lap.pitOut,
          fuelLevel: lap.fuelLevel,
          runtimeEligible: result.runtime.eligible,
          paceEligible: result.pace.eligible,
          runtimeExclusionReasons: [...result.runtime.reasons],
          paceExclusionReasons: [...result.pace.reasons],
          exclusionReason: lap.exclusionReason ?? (exclusionReasons.join(', ') || null),
          stintId: result.stintId,
        },
      ];
    })
    .sort(
      (left, right) =>
        compareText(left.driver, right.driver) ||
        compareText(left.sourceFileName, right.sourceFileName) ||
        left.rowNumber - right.rowNumber ||
        compareText(left.id, right.id),
    );
}

export function buildAuditReportSections(input: AuditReportInput): AuditReportSections {
  return {
    stints: buildStintAnalyses(input),
    lapAudit: buildLapAudit(input.laps, input.eligibility),
  };
}
