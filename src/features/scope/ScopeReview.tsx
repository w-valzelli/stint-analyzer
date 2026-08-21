import type { Lap } from '../../domain/model/normalized';
import type {
  CandidateStint,
  EligibilityReason,
  LapEligibility,
  ScopeGroup,
  ScopeSelection,
} from '../../domain/model/scope';

const reasonLabels: Record<EligibilityReason, string> = {
  'scope-not-configured': 'scope is not configured',
  'scope-excluded': 'source and driver are excluded',
  'no-stint-selected': 'no stint is selected',
  'outside-selected-stint': 'outside the selected stint',
  'lap-bounds-unset': 'lap bounds are not set',
  'outside-lap-bounds': 'outside the selected lap bounds',
  'not-full-timed': 'not a full timed lap',
  'lap-time-unavailable': 'lap time is unavailable',
  'pit-in': 'pit-in lap',
  'pit-out': 'pit-out lap',
  'clean-false': 'Clean is false',
  'clean-status-unavailable': 'Clean is unavailable',
};

type ScopeReviewProps = {
  groups: readonly ScopeGroup[];
  stints: readonly CandidateStint[];
  selections: readonly ScopeSelection[];
  eligibility: readonly LapEligibility[];
  onSelectionChange: (scopeKey: string, update: Partial<Omit<ScopeSelection, 'scopeKey'>>) => void;
};

function controlId(scopeKey: string, suffix: string): string {
  return `scope-${scopeKey.replace(/[^a-z0-9]+/gi, '-')}-${suffix}`;
}

function lapLabel(lap: Lap): string {
  return `Lap ${lap.lapNumber ?? '—'} · row ${lap.rowNumber}`;
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

function stintsFor(stints: readonly CandidateStint[], scopeKey: string): readonly CandidateStint[] {
  return stints.filter((stint) => stint.scopeKey === scopeKey);
}

function selectedStintFor(
  stints: readonly CandidateStint[],
  selection: ScopeSelection | undefined,
): CandidateStint | undefined {
  return stints.find((stint) => stint.id === selection?.selectedStintId);
}

function fullTimedLapsFor(group: ScopeGroup, stint: CandidateStint | undefined): Lap[] {
  if (!stint) {
    return [];
  }

  const stintLapIds = new Set(stint.lapIds);
  return group.laps.filter((lap) => stintLapIds.has(lap.id) && lap.isFullTimedLap);
}

export function ScopeReview({
  groups,
  stints,
  selections,
  eligibility,
  onSelectionChange,
}: ScopeReviewProps) {
  const includedCount = selections.filter((selection) => selection.included).length;
  const runtimeCount = eligibility.filter((item) => item.runtime.eligible).length;
  const paceCount = eligibility.filter((item) => item.pace.eligible).length;

  return (
    <section className="scope-review" aria-labelledby="scope-review-title">
      <div className="scope-review__heading">
        <div>
          <h2 id="scope-review-title">Review scope.</h2>
          <p>
            Select one candidate stint and lap range for each source and driver group. Runtime and
            pace use separate eligibility rules.
          </p>
        </div>
        <div className="scope-review__summary" aria-label="Scope totals">
          <span>{includedCount} included groups</span>
          <span>{runtimeCount} runtime laps</span>
          <span>{paceCount} pace laps</span>
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
            const groupStints = stintsFor(stints, group.scopeKey);
            const selectedStint = selectedStintFor(groupStints, selection);
            const fullTimedLaps = fullTimedLapsFor(group, selectedStint);
            const groupEligibility = eligibility.filter((item) => item.scopeKey === group.scopeKey);
            const cleanUnavailableCount = group.laps.filter((lap) => lap.clean === null).length;
            const selectedStintValue = selection?.selectedStintId ?? '';
            const startLapValue = selection?.startLapId ?? '';
            const endLapValue = selection?.endLapId ?? '';
            const stintControlId = controlId(group.scopeKey, 'stint');
            const startControlId = controlId(group.scopeKey, 'start');
            const endControlId = controlId(group.scopeKey, 'end');
            const paceControlId = controlId(group.scopeKey, 'pace');
            const includeControlId = controlId(group.scopeKey, 'include');

            return (
              <article className="scope-review__group" key={group.scopeKey}>
                <div className="scope-review__group-header">
                  <div>
                    <h3>{group.driver}</h3>
                    <p>{group.sourceFileName}</p>
                  </div>
                  <label className="scope-review__include" htmlFor={includeControlId}>
                    <input
                      id={includeControlId}
                      type="checkbox"
                      checked={selection?.included ?? false}
                      onChange={(event) =>
                        onSelectionChange(group.scopeKey, { included: event.target.checked })
                      }
                    />
                    Include group
                  </label>
                </div>

                <div className="scope-review__controls">
                  <label htmlFor={stintControlId}>
                    Candidate stint
                    <select
                      id={stintControlId}
                      value={selectedStintValue}
                      onChange={(event) => {
                        const nextStint = groupStints.find(
                          (stint) => stint.id === event.target.value,
                        );
                        onSelectionChange(group.scopeKey, {
                          selectedStintId: nextStint?.id ?? null,
                          startLapId: nextStint?.firstFullTimedLapId ?? null,
                          endLapId: nextStint?.lastFullTimedLapId ?? null,
                        });
                      }}
                    >
                      <option value="">No candidate stint</option>
                      {groupStints.map((stint) => (
                        <option key={stint.id} value={stint.id}>
                          Stint {stint.index + 1} · {stint.fullTimedLapCount} timed /{' '}
                          {stint.lapCount} rows
                        </option>
                      ))}
                    </select>
                  </label>

                  <label htmlFor={startControlId}>
                    Runtime start
                    <select
                      id={startControlId}
                      value={startLapValue}
                      onChange={(event) =>
                        onSelectionChange(group.scopeKey, {
                          startLapId: event.target.value || null,
                        })
                      }
                    >
                      <option value="">Not set</option>
                      {fullTimedLaps.map((lap) => (
                        <option key={lap.id} value={lap.id}>
                          {lapLabel(lap)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label htmlFor={endControlId}>
                    Runtime end
                    <select
                      id={endControlId}
                      value={endLapValue}
                      onChange={(event) =>
                        onSelectionChange(group.scopeKey, {
                          endLapId: event.target.value || null,
                        })
                      }
                    >
                      <option value="">Not set</option>
                      {fullTimedLaps.map((lap) => (
                        <option key={lap.id} value={lap.id}>
                          {lapLabel(lap)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label htmlFor={paceControlId}>
                    Pace mode
                    <select
                      id={paceControlId}
                      value={selection?.paceMode ?? 'clean-non-pit'}
                      onChange={(event) =>
                        onSelectionChange(group.scopeKey, {
                          paceMode: event.target.value as ScopeSelection['paceMode'],
                        })
                      }
                    >
                      <option value="clean-non-pit">Clean non-pit</option>
                      <option value="all-non-pit">All non-pit</option>
                    </select>
                  </label>
                </div>

                <div className="scope-review__facts" aria-label={`${group.driver} scope facts`}>
                  <span>{group.laps.length} rows</span>
                  <span>{group.laps.filter((lap) => lap.isFullTimedLap).length} full timed</span>
                  <span>
                    {groupEligibility.filter((item) => item.runtime.eligible).length} runtime
                  </span>
                  <span>{groupEligibility.filter((item) => item.pace.eligible).length} pace</span>
                  {cleanUnavailableCount > 0 && (
                    <span className="scope-review__warning">
                      Clean unavailable on {cleanUnavailableCount} row
                      {cleanUnavailableCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <details className="scope-review__audit">
                  <summary>Lap audit ({group.laps.length} rows)</summary>
                  <div className="scope-review__audit-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Row</th>
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
                              <th scope="row">{lap.rowNumber}</th>
                              <td>{lap.lapNumber ?? '—'}</td>
                              <td>{stateLabel(result.runtime)}</td>
                              <td>{stateLabel(result.pace)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
