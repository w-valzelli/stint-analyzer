import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import { CustomSelect } from '../../components/ui/select';

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
  return `${lap.lapNumber ?? '—'}`;
}

function driverHeadingId(driver: string): string {
  return `scope-driver-${driver.replace(/[^a-z0-9]+/gi, '-')}`;
}

function controlId(label: string): string {
  return `scope-select-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
}

function stateLabel(state: LapEligibility['runtime']): string {
  if (state.eligible) {
    return 'Included';
  }
  return `Excluded: ${state.reasons.map((reason) => reasonLabels[reason]).join('; ')}`;
}

type AuditStatusProps = {
  state: LapEligibility['runtime'];
  label: string;
};

type PopoverPosition = {
  top: number;
  left: number;
};

function AuditStatus({ state, label }: AuditStatusProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const isOpen = isHovered || isClicked;
  const popoverId = controlId(`${label}-reasons`);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setIsClicked(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsClicked(false);
        setIsHovered(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPopoverPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) {
        return;
      }
      const bounds = button.getBoundingClientRect();
      const width = 230;
      const margin = 8;
      const top =
        bounds.bottom + 100 < window.innerHeight
          ? bounds.bottom + 6
          : Math.max(margin, bounds.top - 86);
      const left = Math.min(
        Math.max(margin, bounds.left),
        Math.max(margin, window.innerWidth - width - margin),
      );
      setPopoverPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  if (state.eligible) {
    return (
      <span className="scope-review__audit-status scope-review__audit-status--included">
        Included
      </span>
    );
  }

  return (
    <span
      className="scope-review__audit-status-wrap"
      ref={rootRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        className="scope-review__audit-status scope-review__audit-status--excluded"
        ref={buttonRef}
        aria-controls={popoverId}
        aria-expanded={isOpen}
        aria-label={`${label}: ${stateLabel(state)}`}
        onClick={() => setIsClicked((clicked) => !clicked)}
      >
        Excluded
      </button>
      {isOpen &&
        popoverPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            className="scope-review__audit-popover"
            id={popoverId}
            ref={popoverRef}
            role="dialog"
            aria-label={`${label} exclusion reasons`}
            style={popoverPosition}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <strong>Exclusion reasons</strong>
            <span>{state.reasons.map((reason) => reasonLabels[reason]).join(' · ')}</span>
          </span>,
          document.body,
        )}
    </span>
  );
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

function stintLabel(stint: CandidateStint, stints: readonly CandidateStint[]): string {
  const index = stints.findIndex((candidate) => candidate.id === stint.id);
  return `Stint ${index + 1}`;
}

function selectionLabel(
  stints: readonly CandidateStint[],
  selectedIds: ReadonlySet<string>,
): string {
  const available = availableStints(stints);
  if (available.length === 0 || selectedIds.size === 0) {
    return available.length === 0 ? 'No timed stints' : 'No stints selected';
  }
  if (selectedIds.size === available.length) {
    return 'All stints';
  }
  if (selectedIds.size === 1) {
    const selected = available.find((stint) => selectedIds.has(stint.id));
    return selected ? stintLabel(selected, available) : 'No stints selected';
  }
  return `${selectedIds.size} stints selected`;
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
        <h2 id="scope-review-title">Review scope.</h2>
        <p>
          Choose the stints that belong in the comparison. <br /> Runtime and pace use separate
          rules.
        </p>
      </div>

      <div className="scope-review__summary-row">
        <div className="scope-review__summary" aria-label="Scope totals">
          <div className="scope-review__summary-stat">
            <strong>{groups.length}</strong>
            <span>drivers</span>
          </div>
          <div className="scope-review__summary-stat">
            <strong>{runtimeCount}</strong>
            <span>runtime laps</span>
          </div>
          <div className="scope-review__summary-stat">
            <strong>{paceCount}</strong>
            <span>pace laps</span>
          </div>
        </div>

        <div className="scope-review__pace-control scope-review__pace-control--global">
          <span>Pace mode</span>
          <CustomSelect
            label="Pace mode"
            value={paceMode}
            disabled={isHydrated ? groups.length === 0 : undefined}
            options={[
              { value: 'clean-non-pit', label: 'Clean non-pit' },
              { value: 'all-non-pit', label: 'All non-pit' },
            ]}
            onChange={(value) => onPaceModeChange(value as PaceMode)}
          />
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
            const completedLaps = group.laps.filter((lap) => lap.isFullTimedLap);
            const cleanUnavailableCount = completedLaps.filter((lap) => lap.clean === null).length;
            const headingId = driverHeadingId(group.driver);

            return (
              <article
                className="analysis-surface scope-review__driver"
                key={group.scopeKey}
                aria-labelledby={headingId}
              >
                <div className="scope-review__driver-body">
                  <div className="scope-review__driver-header">
                    <h3 id={headingId}>{group.driver}</h3>
                    <div className="scope-review__facts" aria-label={`${group.driver} scope facts`}>
                      <span>
                        <strong>{completedLaps.length}</strong> completed
                      </span>
                      <span>
                        <strong>{completedLaps.length}</strong> timed
                      </span>
                      <span>
                        <strong>
                          {groupEligibility.filter((item) => item.runtime.eligible).length}
                        </strong>{' '}
                        runtime
                      </span>
                      <span>
                        <strong>
                          {groupEligibility.filter((item) => item.pace.eligible).length}
                        </strong>{' '}
                        pace
                      </span>
                    </div>
                  </div>

                  <div className="scope-review__controls">
                    <div className="scope-review__stint-control">
                      <span>Stint selection</span>
                      {selectableStints.length === 0 ? (
                        <p className="scope-review__no-stints">No timed stints available.</p>
                      ) : (
                        <CustomSelect
                          label={`Stints for ${group.driver}`}
                          triggerLabel={selectionLabel(group.stints, selectedIds)}
                          value={[...selectedIds]}
                          multiple
                          allOptionValue={ALL_STINTS_OPTION}
                          options={[
                            {
                              value: ALL_STINTS_OPTION,
                              label: 'All stints',
                              detail: `${selectableStints.length} ${selectableStints.length === 1 ? 'stint' : 'stints'}`,
                            },
                            ...selectableStints.map((stint, index) => ({
                              value: stint.id,
                              label: `Stint ${index + 1}`,
                              detail: `${stint.fullTimedLapCount} timed laps`,
                            })),
                          ]}
                          onChange={(value) =>
                            onSelectionChange(group.scopeKey, {
                              selectedStintIds: value as string[],
                            })
                          }
                        />
                      )}
                    </div>
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
                                <td>
                                  <AuditStatus
                                    state={result.runtime}
                                    label={`${lapLabel(lap)} runtime`}
                                  />
                                </td>
                                <td>
                                  <AuditStatus
                                    state={result.pace}
                                    label={`${lapLabel(lap)} pace`}
                                  />
                                </td>
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
