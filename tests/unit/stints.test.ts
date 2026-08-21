import { describe, expect, it } from 'vitest';

import {
  createDefaultScopeSelections,
  detectCandidateStints,
  groupLapsByDriver,
  groupLapsByScope,
} from '../../src/domain/analytics/stints';
import { makeLap, stintFixtureLaps } from '../fixtures/scopeLaps';

describe('scope grouping and stint detection', () => {
  it('keeps source boundaries internally and merges the driver view', () => {
    const sourceGroups = groupLapsByScope(stintFixtureLaps);
    const driverGroups = groupLapsByDriver(stintFixtureLaps);

    expect(sourceGroups).toHaveLength(2);
    expect(driverGroups).toHaveLength(1);
    expect(driverGroups[0]?.driver).toBe('Alice');
    expect(driverGroups[0]?.stints).toHaveLength(4);
  });

  it('splits candidates at pit transitions, run changes, and lap resets', () => {
    const group = groupLapsByScope(stintFixtureLaps)[0];
    const stints = detectCandidateStints(group);

    expect(stints.map((stint) => stint.lapIds)).toEqual([
      ['alice-1', 'alice-2'],
      ['alice-3', 'alice-4'],
      ['alice-5'],
    ]);
    expect(stints[0]?.inLapId).toBe('alice-2');
    expect(stints[1]?.outLapId).toBe('alice-3');
  });

  it('uses timestamps only when every timestamp in a source group is valid', () => {
    const timestamped = [
      makeLap({ id: 'late', rowNumber: 1, startedAt: '2026-01-01T10:02:00Z' }),
      makeLap({ id: 'early', rowNumber: 2, startedAt: '2026-01-01T10:01:00Z' }),
    ];
    const partiallyTimestamped = [
      makeLap({ id: 'first', rowNumber: 1, startedAt: '2026-01-01T10:02:00Z' }),
      makeLap({ id: 'second', rowNumber: 2, startedAt: null }),
    ];

    expect(groupLapsByScope(timestamped)[0]?.laps.map((lap) => lap.id)).toEqual(['early', 'late']);
    expect(groupLapsByScope(partiallyTimestamped)[0]?.laps.map((lap) => lap.id)).toEqual([
      'first',
      'second',
    ]);
  });

  it('selects the longest non-empty candidate by default', () => {
    const selections = createDefaultScopeSelections(stintFixtureLaps);

    expect(selections[0]).toMatchObject({
      selectedStintIds: [expect.stringContaining('stint-1')],
    });
  });

  it('does not select a driver when every candidate has zero timed laps', () => {
    const partial = makeLap({
      id: 'partial',
      isFullTimedLap: false,
      classification: 'partial',
      lapTimeUs: null,
    });

    expect(createDefaultScopeSelections([partial])[0]?.selectedStintIds).toEqual([]);
  });
});
