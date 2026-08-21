import type { Lap } from '../../src/domain/model/normalized';

export function makeLap(overrides: Partial<Lap> = {}): Lap {
  return {
    id: 'lap-1',
    sourceFileId: 'source-a',
    sourceFileName: 'source-a.xlsx',
    rowNumber: 1,
    driver: 'Alice',
    run: 1,
    lapNumber: 1,
    startedAt: null,
    lapTimeUs: 10_000_000,
    sectorsUs: { S1: 5_000_000, S2: 5_000_000 },
    clean: true,
    pitIn: false,
    pitOut: false,
    fuelLevel: null,
    fuelUsed: null,
    fuelAdded: null,
    trackTemp: null,
    airTemp: null,
    isFullTimedLap: true,
    classification: 'full',
    exclusionReason: null,
    sectorSumDeltaUs: 0,
    ...overrides,
  };
}

export const stintFixtureLaps: Lap[] = [
  makeLap({ id: 'alice-1', rowNumber: 1, lapNumber: 1 }),
  makeLap({ id: 'alice-2', rowNumber: 2, lapNumber: 2, clean: false, pitIn: true }),
  makeLap({ id: 'alice-3', rowNumber: 3, lapNumber: 3, pitOut: true }),
  makeLap({ id: 'alice-4', rowNumber: 4, lapNumber: 4, clean: null }),
  makeLap({ id: 'alice-5', rowNumber: 5, lapNumber: 1, run: 2 }),
  makeLap({
    id: 'alice-other-source',
    sourceFileId: 'source-b',
    sourceFileName: 'source-b.xlsx',
    rowNumber: 1,
  }),
];
