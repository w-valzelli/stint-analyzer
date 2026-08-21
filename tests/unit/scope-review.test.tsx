import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useMemo, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { deriveLapEligibility } from '../../src/domain/analytics/eligibility';
import {
  createDefaultScopeSelections,
  detectStints,
  groupLapsByDriver,
} from '../../src/domain/analytics/stints';
import type { Lap } from '../../src/domain/model/normalized';
import type { PaceMode, ScopeSelection } from '../../src/domain/model/scope';
import { ScopeReview } from '../../src/features/scope/ScopeReview';
import { makeLap, stintFixtureLaps } from '../fixtures/scopeLaps';

type HarnessProps = {
  laps: readonly Lap[];
};

function ScopeHarness({ laps }: HarnessProps) {
  const groups = useMemo(() => groupLapsByDriver(laps), [laps]);
  const stints = useMemo(() => detectStints(laps), [laps]);
  const [selections, setSelections] = useState(() => createDefaultScopeSelections(laps));
  const [paceMode, setPaceMode] = useState<PaceMode>('clean-non-pit');
  const eligibility = useMemo(
    () => deriveLapEligibility(laps, selections, stints, paceMode),
    [laps, paceMode, selections, stints],
  );

  const handleSelectionChange = (
    scopeKey: string,
    update: Partial<Omit<ScopeSelection, 'scopeKey'>>,
  ) => {
    setSelections((current) =>
      current.map((selection) =>
        selection.scopeKey === scopeKey ? { ...selection, ...update } : selection,
      ),
    );
  };

  return (
    <ScopeReview
      groups={groups}
      selections={selections}
      eligibility={eligibility}
      paceMode={paceMode}
      onPaceModeChange={setPaceMode}
      onSelectionChange={handleSelectionChange}
    />
  );
}

function driverCard(driver: string): HTMLElement {
  const card = screen.getByRole('heading', { name: driver }).closest('article');
  if (!card) {
    throw new Error(`Missing ${driver} driver card.`);
  }
  return card;
}

describe('ScopeReview', () => {
  afterEach(() => cleanup());

  it('shows one driver card and one global pace selector across multiple files', () => {
    render(<ScopeHarness laps={stintFixtureLaps} />);

    expect(screen.getAllByRole('heading', { name: 'Alice' })).toHaveLength(1);
    expect(screen.queryByText('source-a.xlsx')).not.toBeInTheDocument();
    expect(screen.queryByText('source-b.xlsx')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listbox', { name: 'Stints for Alice' })).toHaveLength(1);
    expect(screen.getAllByLabelText('Pace mode')).toHaveLength(1);
  });

  it('omits zero-timed stints from the multi-select', () => {
    const partial = makeLap({
      id: 'bob-partial',
      driver: 'Bob',
      sourceFileId: 'source-c',
      sourceFileName: 'source-c.xlsx',
      isFullTimedLap: false,
      classification: 'partial',
      lapTimeUs: null,
    });
    render(<ScopeHarness laps={[...stintFixtureLaps, partial]} />);

    const bob = within(driverCard('Bob'));
    expect(bob.getByText('No timed stints available.')).toBeVisible();
    expect(bob.queryByRole('listbox', { name: 'Stints for Bob' })).not.toBeInTheDocument();
  });

  it('selects and clears all available stints through the All stints option', () => {
    render(<ScopeHarness laps={stintFixtureLaps} />);
    const driver = within(driverCard('Alice'));
    const listbox = driver.getByRole('listbox', { name: 'Stints for Alice' }) as HTMLSelectElement;
    const allOption = within(listbox).getByRole('option', {
      name: 'All stints',
    }) as HTMLOptionElement;

    expect(driver.getByText('2 runtime laps')).toBeInTheDocument();
    allOption.selected = true;
    fireEvent.change(listbox);

    expect(driver.getByText('6 runtime laps')).toBeInTheDocument();
    expect(driver.getByText('3 pace laps')).toBeInTheDocument();
    expect(listbox.value).toContain('__all_stints__');

    allOption.selected = false;
    fireEvent.change(listbox);
    expect(driver.getByText('0 runtime laps')).toBeInTheDocument();
    expect(driver.getByText('0 pace laps')).toBeInTheDocument();
  });

  it('updates the global pace counts for every driver', () => {
    const laps = [
      makeLap({ id: 'clean', rowNumber: 1 }),
      makeLap({ id: 'unclean', rowNumber: 2, lapNumber: 2, clean: false }),
    ];
    render(<ScopeHarness laps={laps} />);
    const driver = within(driverCard('Alice'));

    expect(driver.getByText('1 pace laps')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Pace mode'), {
      target: { value: 'all-non-pit' },
    });

    expect(driver.getByText('2 pace laps')).toBeInTheDocument();
  });

  it('disables the global pace selector before import', () => {
    render(<ScopeHarness laps={[]} />);

    expect(screen.getByLabelText('Pace mode')).toBeDisabled();
  });

  it('shows user-facing audit labels without source or row details', () => {
    render(<ScopeHarness laps={stintFixtureLaps} />);
    const card = driverCard('Alice');
    const audit = within(card).getByText('Lap audit (6 laps)');
    fireEvent.click(audit);

    expect(within(card).getByText(/Inlap/)).toBeVisible();
    expect(within(card).getByText(/Outlap/)).toBeVisible();
    expect(within(card).getByText(/Not clean/)).toBeVisible();
    expect(within(card).queryByText(/pit-in|pit-out|Clean is false|row/)).not.toBeInTheDocument();
  });
});
