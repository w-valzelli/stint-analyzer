import { describe, expect, it } from 'vitest';

import { deriveLapEligibility } from '../../src/domain/analytics/eligibility';
import { detectCandidateStints, groupLapsByScope } from '../../src/domain/analytics/stints';
import type { ScopeSelection } from '../../src/domain/model/scope';
import { makeLap } from '../fixtures/scopeLaps';

function selectionFor(
  laps: Parameters<typeof deriveLapEligibility>[0],
  paceMode: ScopeSelection['paceMode'] = 'clean-non-pit',
): { selection: ScopeSelection; stints: ReturnType<typeof detectCandidateStints> } {
  const group = groupLapsByScope(laps)[0];
  const stints = detectCandidateStints(group);
  const stint = stints[0];
  if (!stint) {
    throw new Error('The test needs one candidate stint.');
  }

  return {
    stints,
    selection: {
      scopeKey: group.scopeKey,
      included: true,
      selectedStintId: stint.id,
      startLapId: stint.firstFullTimedLapId,
      endLapId: stint.lastFullTimedLapId,
      paceMode,
    },
  };
}

describe('lap eligibility', () => {
  it('keeps pit and unclean laps in runtime while applying default pace rules', () => {
    const laps = [
      makeLap({ id: 'clean', rowNumber: 1 }),
      makeLap({ id: 'unclean', rowNumber: 2, clean: false, lapNumber: 2 }),
      makeLap({ id: 'unknown', rowNumber: 3, clean: null, lapNumber: 3 }),
      makeLap({
        id: 'partial',
        rowNumber: 4,
        lapNumber: 4,
        isFullTimedLap: false,
        classification: 'partial',
        exclusionReason: 'Missing sector',
        lapTimeUs: null,
      }),
      makeLap({ id: 'pit-in', rowNumber: 5, pitIn: true, lapNumber: 5 }),
    ];
    const { selection, stints } = selectionFor(laps);
    const results = deriveLapEligibility(laps, [selection], stints);

    expect(results.map((result) => result.runtime.eligible)).toEqual([
      true,
      true,
      true,
      false,
      true,
    ]);
    expect(results.map((result) => result.pace.eligible)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(results[1]?.pace.reasons).toContain('clean-false');
    expect(results[2]?.pace.reasons).toContain('clean-status-unavailable');
    expect(results[3]?.runtime.reasons).toContain('not-full-timed');
    expect(results[4]?.pace.reasons).toContain('pit-in');
  });

  it('includes unknown and unclean non-pit laps in all-non-pit mode', () => {
    const laps = [
      makeLap({ id: 'clean', rowNumber: 1 }),
      makeLap({ id: 'unclean', rowNumber: 2, clean: false, lapNumber: 2 }),
      makeLap({ id: 'unknown', rowNumber: 3, clean: null, lapNumber: 3 }),
    ];
    const { selection, stints } = selectionFor(laps, 'all-non-pit');
    const results = deriveLapEligibility(laps, [selection], stints);

    expect(results.every((result) => result.pace.eligible)).toBe(true);
  });

  it('reports explicit reasons for missing, excluded, and out-of-bound scopes', () => {
    const laps = [
      makeLap({ id: 'first', rowNumber: 1 }),
      makeLap({ id: 'second', rowNumber: 2, lapNumber: 2 }),
    ];
    const { selection, stints } = selectionFor(laps);
    const bounded = { ...selection, startLapId: 'second', endLapId: 'second' };
    const boundedResults = deriveLapEligibility(laps, [bounded], stints);
    const excludedResults = deriveLapEligibility(
      laps,
      [{ ...selection, included: false }],
      stints,
    );
    const missingResults = deriveLapEligibility(laps, [], stints);

    expect(boundedResults[0]?.runtime.reasons).toContain('outside-lap-bounds');
    expect(excludedResults[0]?.runtime.reasons).toEqual(['scope-excluded']);
    expect(missingResults[0]?.runtime.reasons).toEqual(['scope-not-configured']);
  });

  it('keeps pit-out laps in runtime and excludes them from pace', () => {
    const laps = [makeLap({ id: 'pit-out', pitOut: true })];
    const { selection, stints } = selectionFor(laps);
    const result = deriveLapEligibility(laps, [selection], stints)[0];

    expect(result?.runtime.eligible).toBe(true);
    expect(result?.pace.eligible).toBe(false);
    expect(result?.pace.reasons).toContain('pit-out');
  });
});
