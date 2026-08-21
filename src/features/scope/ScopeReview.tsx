import { useEffect, useState, type ChangeEvent } from 'react';

import type { Lap } from '../../domain/model/normalized';
import type {
  CandidateStint,
  DriverScopeGroup,
  EligibilityReason,
  LapEligibility,
  PaceMode,
  ScopeSelection,
} from '../../domain/model/scope';

const ALL_STINTS_OPTION = '__all_stints__';

const reasonLabels: Record<EligibilityReason, string> = {
  'scope-not-configured': 'Scope unavailable',
  'stint-not-selected': 'Stint not selected',
  'not-full-timed': 'Incomplete lap',
  'lap-time-unavailable': 'Lap time unavailable',
  'pit-in': 'Inlap',
  'pit-out': 'Outlap',
  'clean-false': 'Not clean',
  'clean-status-unavailable': 'Clean status unavailable',
};

type ScopeReviewProps = {
  groups: readonly DriverScopeGroup[];
  selections: readonly ScopeSelection[];
  eligibility: readonly LapEligibility[];
  paceMode: PaceMode;
  onPaceModeChange: (paceMode: PaceMode) => void;
  onSelectionChange: (scopeKey: string, update: Partial<Omit<ScopeSelection, 'scopeKey'>>) => void;
};

function lapLabel(lap: Lap): string {
  return `Lap ${lap.lapNumber ?? '—'}`;
}

function driverHeadingId(driver: string): string {
  return `scope-driver-${driver.replace(/[^a-z0-9]+/gi, '-')}`;
}

function stateLabel(state: LapEligibility['runtime']): string {
  if (state.eligible) {
    return 'Included';
  }
  return `Excluded: ${state.reasons.map((reason) => reasonLabels[reason]).join('; ')}`;
}

function selectionFor(
  selections: readonly ScopeSelection[],
  scopeKey: string,
): ScopeSelection | undefined {
  return selections.find((selection) => selection.scopeKey === scopeKey);
}

function availableStints(stints: readonly CandidateStint[]): CandidateStint[] {
  return stints.filter((stint) => stint.fullTimedLapCount > 0);
}

function selectedStintIdsFor(
  stints: readonly CandidateStint[],
  selection: ScopeSelection | undefined,
): Set<string> {
  const availableIds = new Set(availableStints(stints).map((stint) => stint.id));
  return new Set(
    (selection?.selectedStintIds ?? []).filter((stintId) => availableIds.has(stintId)),
  );
}

function selectedValues(
  stints: readonly CandidateStint[],
  selectedIds: ReadonlySet<string>,
): string[] {
  const available = availableStints(stints);
  const allSelected = available.length > 0 && selectedIds.size === available.length;
  return allSelected
    ? [ALL_STINTS_OPTION, ...available.map((stint) => stint.id)]
    : [...selectedIds];
}

function nextSelectedStintIds(
  event: ChangeEvent<HTMLSelectElement>,
  stints: readonly CandidateStint[],
  previousIds: ReadonlySet<string>,
): string[] {
  const available = availableStints(stints);
  const availableIds = available.map((stint) => stint.id);
  const values = [...event.currentTarget.selectedOptions].map((option) => option.value);
  const hasAllOption = values.includes(ALL_STINTS_OPTION);
  const selectedIds = values.filter((value) => value !== ALL_STINTS_OPTION);
  const wasAllSelected = previousIds.size === available.length && available.length > 0;

  if (hasAllOption && !wasAllSelected) {
    return availableIds;
  }
  if (hasAllOption) {
    return selectedIds.length === availableIds.length ? availableIds : selectedIds;
  }
  if (wasAllSelected && selectedIds.length === availableIds.length) {
    return [];
  }
  return selectedIds;
}

export function ScopeReview({
  groups,
  selections,
  eligibility,
  paceMode,
  onPaceModeChange,
  onSelectionChange,
}: ScopeReviewProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const runtimeCount = eligibility.filter((item) => item.runtime.eligible).length;
  const paceCount = eligibility.filter((item) => item.pace.eligible).length;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <section className="scope-review" aria-labelledby="scope-review-title">
      <div className="scope-review__heading">
        <div>
          <h2 id="scope-review-title">Review scope.</h2>
          <p>Select the stints for each driver. Runtime and pace use separate eligibility rules.</p>
        </div>
        <div className="scope-review__heading-actions">
          <div className="scope-review__summary" aria-label="Scope totals">
            <span>{groups.length} drivers</span>
            <span>{runtimeCount} runtime laps</span>
            <span>{paceCount} pace laps</span>
          </div>
          <label className="scope-review__pace-control scope-review__pace-control--global">
            Pace mode
            <select
              value={paceMode}
              disabled={isHydrated ? groups.length === 0 : undefined}
              onChange={(event) => onPaceModeChange(event.target.value as PaceMode)}
            >
              <option value="clean-non-pit">Clean non-pit</option>
              <option value="all-non-pit">All non-pit</option>
            </select>
          </label>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="scope-review__empty">
          Import a workbook to review its runtime and pace scope.
        </p>
      ) : (
        <div className="scope-review__groups">
          {groups.map((group) => {
            const selection = selectionFor(selections, group.scopeKey);
            const selectableStints = availableStints(group.stints);
            const selectedIds = selectedStintIdsFor(group.stints, selection);
            const groupEligibility = eligibility.filter((item) => item.scopeKey === group.scopeKey);
            const cleanUnavailableCount = group.laps.filter((lap) => lap.clean === null).length;

            const headingId = driverHeadingId(group.driver);

            return (
              <article
                className="calibration-sheet scope-review__driver"
                key={group.scopeKey}
                aria-labelledby={headingId}
              >
                <div className="calibration-sheet__body">
                  <div className="scope-review__driver-header">
                    <h3 id={headingId}>{group.driver}</h3>
                    <div className="scope-review__facts" aria-label={`${group.driver} scope facts`}>
                      <span>{group.laps.length} laps</span>
                      <span>
                        {group.laps.filter((lap) => lap.isFullTimedLap).length} timed laps
                      </span>
                      <span>
                        {groupEligibility.filter((item) => item.runtime.eligible).length} runtime
                        laps
                      </span>
                      <span>
                        {groupEligibility.filter((item) => item.pace.eligible).length} pace laps
                      </span>
                    </div>
                  </div>

                  <div className="scope-review__controls">
                    <label className="scope-review__stint-control">
                      Stints
                      {selectableStints.length === 0 ? (
                        <p className="scope-review__no-stints">No timed stints available.</p>
                      ) : (
                        <select
                          multiple
                          size={Math.min(selectableStints.length + 1, 6)}
                          value={selectedValues(group.stints, selectedIds)}
                          onChange={(event) =>
                            onSelectionChange(group.scopeKey, {
                              selectedStintIds: nextSelectedStintIds(
                                event,
                                group.stints,
                                selectedIds,
                              ),
                            })
                          }
                          aria-label={`Stints for ${group.driver}`}
                        >
                          <option value={ALL_STINTS_OPTION}>All stints</option>
                          {selectableStints.map((stint, index) => (
                            <option key={stint.id} value={stint.id}>
                              Stint {index + 1} · {stint.fullTimedLapCount} timed laps
                            </option>
                          ))}
                        </select>
                      )}
                    </label>
                  </div>

                  {cleanUnavailableCount > 0 && (
                    <p className="scope-review__warning">
                      Clean status unavailable on {cleanUnavailableCount}{' '}
                      {cleanUnavailableCount === 1 ? 'lap' : 'laps'}.
                    </p>
                  )}

                  <details className="scope-review__audit">
                    <summary>Lap audit ({group.laps.length} laps)</summary>
                    <div className="scope-review__audit-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">Lap</th>
                            <th scope="col">Runtime</th>
                            <th scope="col">Pace</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.laps.map((lap) => {
                            const result = groupEligibility.find((item) => item.lapId === lap.id);
                            if (!result) {
                              return null;
                            }
                            return (
                              <tr key={lap.id}>
                                <th scope="row">{lapLabel(lap)}</th>
                                <td>{stateLabel(result.runtime)}</td>
                                <td>{stateLabel(result.pace)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
