import { describe, expect, it } from 'vitest';

import { deriveLapEligibility } from '../../src/domain/analytics/eligibility';
import { detectStints, groupLapsByDriver } from '../../src/domain/analytics/stints';
import type { ScopeSelection } from '../../src/domain/model/scope';
import { makeLap, stintFixtureLaps } from '../fixtures/scopeLaps';

function selectionFor(laps: Parameters<typeof deriveLapEligibility>[0]): {
  selection: ScopeSelection;
  stints: ReturnType<typeof detectStints>;
} {
  const group = groupLapsByDriver(laps)[0];
  const stints = detectStints(laps);
  const stint = group?.stints[0];
  if (!group || !stint) {
    throw new Error('The test needs one candidate stint.');
  }

  return {
    stints,
    selection: {
      scopeKey: group.scopeKey,
      selectedStintIds: [stint.id],
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
    const results = deriveLapEligibility(laps, [selection], stints, 'clean-non-pit');

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
    const { selection, stints } = selectionFor(laps);
    const results = deriveLapEligibility(laps, [selection], stints, 'all-non-pit');

    expect(results.every((result) => result.pace.eligible)).toBe(true);
  });

  it('aggregates multiple selected stints for one driver', () => {
    const stints = detectStints(stintFixtureLaps);
    const group = groupLapsByDriver(stintFixtureLaps)[0];
    if (!group) {
      throw new Error('The test needs one driver.');
    }
    const selection: ScopeSelection = {
      scopeKey: group.scopeKey,
      selectedStintIds: group.stints
        .filter((stint) => stint.fullTimedLapCount > 0)
        .map((stint) => stint.id),
    };
    const results = deriveLapEligibility(stintFixtureLaps, [selection], stints, 'all-non-pit');

    expect(results.every((result) => result.runtime.eligible)).toBe(true);
    expect(results.filter((result) => result.pace.eligible)).toHaveLength(4);
  });

  it('reports explicit reasons for missing scope and unselected stints', () => {
    const laps = [
      makeLap({ id: 'first', rowNumber: 1 }),
      makeLap({ id: 'second', rowNumber: 2, lapNumber: 2, run: 2 }),
    ];
    const stints = detectStints(laps);
    const group = groupLapsByDriver(laps)[0];
    if (!group || !stints[0]) {
      throw new Error('The test needs one driver and one stint.');
    }

    const selectedFirstOnly: ScopeSelection = {
      scopeKey: group.scopeKey,
      selectedStintIds: [stints[0].id],
    };
    const selectedResults = deriveLapEligibility(
      laps,
      [selectedFirstOnly],
      stints,
      'clean-non-pit',
    );
    const missingResults = deriveLapEligibility(laps, [], stints, 'clean-non-pit');

    expect(selectedResults[1]?.runtime.reasons).toContain('stint-not-selected');
    expect(missingResults[0]?.runtime.reasons).toEqual(['scope-not-configured']);
  });

  it('keeps pit-out laps in runtime and excludes them from pace', () => {
    const laps = [makeLap({ id: 'pit-out', pitOut: true })];
    const { selection, stints } = selectionFor(laps);
    const result = deriveLapEligibility(laps, [selection], stints, 'clean-non-pit')[0];

    expect(result?.runtime.eligible).toBe(true);
    expect(result?.pace.eligible).toBe(false);
    expect(result?.pace.reasons).toContain('pit-out');
  });
});
