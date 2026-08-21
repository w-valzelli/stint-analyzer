import { buildAnalysisReport } from '../../src/domain/analytics/report';
import { createDefaultScopeSelections } from '../../src/domain/analytics/stints';
import type { AnalysisReport } from '../../src/domain/model/report';
import type { Lap, ParsedWorkbook } from '../../src/domain/model/normalized';
import { makeLap } from './scopeLaps';

export function makeAnalysisReport(): AnalysisReport {
  const laps: Lap[] = [
    makeLap({
      id: 'alice-1',
      sourceFileName: 'private/session-a.xlsx',
      rowNumber: 1,
      driver: 'Alice',
      lapNumber: 1,
      lapTimeUs: 10_000_000,
      sectorsUs: { S1: 4_000_000, S2: 6_000_000 },
    }),
    makeLap({
      id: 'alice-2',
      sourceFileName: 'private/session-a.xlsx',
      rowNumber: 2,
      driver: 'Alice',
      lapNumber: 2,
      lapTimeUs: 11_000_000,
      sectorsUs: { S1: 5_000_000, S2: 6_000_000 },
      clean: false,
      pitIn: true,
    }),
    makeLap({
      id: 'bob-1',
      sourceFileName: 'private/session-a.xlsx',
      rowNumber: 3,
      driver: 'Bob',
      lapNumber: 1,
      lapTimeUs: 9_000_000,
      sectorsUs: { S1: 4_000_000, S2: 5_000_000 },
    }),
    makeLap({
      id: 'bob-2',
      sourceFileName: 'private/session-a.xlsx',
      rowNumber: 4,
      driver: 'Bob',
      lapNumber: 2,
      lapTimeUs: 9_500_000,
      sectorsUs: { S1: 4_000_000, S2: 5_500_000 },
    }),
  ];
  const workbook: ParsedWorkbook = {
    source: {
      id: 'source-a',
      name: 'private/session-a.xlsx',
      hash: 'a'.repeat(64),
      sheetName: 'Session - Practice',
      driverName: 'Alice, Bob',
      trackName: 'Test Track',
      carName: 'Test Car',
      driverNames: ['Alice', 'Bob'],
      sectorNames: ['S1', 'S2'],
      timedLapCount: 4,
      fullTimedLapCount: 4,
      partialLapCount: 0,
      warningCount: 0,
    },
    laps,
    warnings: [],
  };

  return buildAnalysisReport({
    workbooks: [workbook],
    selections: createDefaultScopeSelections(laps),
    paceMode: 'clean-non-pit',
    generatedAt: '2026-08-21T12:34:00.000Z',
  });
}
