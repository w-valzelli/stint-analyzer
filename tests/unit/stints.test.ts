import { describe, expect, it } from 'vitest';

import {
  createDefaultScopeSelections,
  detectCandidateStints,
  groupLapsByDriver,
  groupLapsByScope,
  reconcileScopeSelections,
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

  it('selects every non-empty candidate by default', () => {
    const selections = createDefaultScopeSelections(stintFixtureLaps);
    const expectedStintIds = groupLapsByDriver(stintFixtureLaps)[0]
      ?.stints.filter((stint) => stint.fullTimedLapCount > 0)
      .map((stint) => stint.id);

    expect(selections[0]?.selectedStintIds).toEqual(expectedStintIds);
  });

  it('defaults new driver selections to all stints and preserves explicit subsets', () => {
    const group = groupLapsByDriver(stintFixtureLaps)[0];
    const allStintIds = group?.stints
      .filter((stint) => stint.fullTimedLapCount > 0)
      .map((stint) => stint.id);

    expect(reconcileScopeSelections(stintFixtureLaps, [])).toEqual([
      {
        scopeKey: group?.scopeKey,
        selectedStintIds: allStintIds,
      },
    ]);

    const selectedSubset = allStintIds?.slice(0, 1) ?? [];
    expect(
      reconcileScopeSelections(stintFixtureLaps, [
        { scopeKey: group?.scopeKey ?? '', selectedStintIds: selectedSubset },
      ]),
    ).toEqual([
      {
        scopeKey: group?.scopeKey,
        selectedStintIds: selectedSubset,
      },
    ]);
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
