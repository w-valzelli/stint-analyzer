import { describe, expect, it } from 'vitest';

import {
  createDefaultScopeSelections,
  detectCandidateStints,
  groupLapsByScope,
} from '../../src/domain/analytics/stints';
import { makeLap, stintFixtureLaps } from '../fixtures/scopeLaps';

describe('scope grouping and stint detection', () => {
  it('keeps the same driver in separate source groups', () => {
    const groups = groupLapsByScope(stintFixtureLaps);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => [group.sourceFileId, group.driver])).toEqual([
      ['source-a', 'Alice'],
      ['source-b', 'Alice'],
    ]);
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

  it('uses timestamps only when every timestamp in a group is valid', () => {
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

  it('selects the longest candidate and breaks ties by earliest candidate', () => {
    const selections = createDefaultScopeSelections(stintFixtureLaps);

    expect(selections[0]).toMatchObject({
      selectedStintId: expect.stringContaining('stint-1'),
      startLapId: 'alice-1',
      endLapId: 'alice-2',
      paceMode: 'clean-non-pit',
    });
  });
});
