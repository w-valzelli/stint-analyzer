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
    const aliceCard = driverCard('Alice');
    expect(aliceCard.querySelector('button[aria-label="Stints for Alice"]')).toBeInTheDocument();
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

    const bobCard = driverCard('Bob');
    const bob = within(bobCard);
    expect(bob.getByText('No timed stints available.')).toBeVisible();
    expect(bobCard.querySelector('button[aria-label="Stints for Bob"]')).not.toBeInTheDocument();
  });

  it('selects and clears all available stints through the All stints option', () => {
    render(<ScopeHarness laps={stintFixtureLaps} />);
    const driver = within(driverCard('Alice'));
    const trigger = driver.getByRole('button', { name: 'Stints for Alice' });
    const facts = driver.getByLabelText('Alice scope facts');

    expect(facts).toHaveTextContent('2 runtime');
    fireEvent.click(trigger);
    fireEvent.click(driver.getByRole('option', { name: /All stints/ }));

    expect(facts).toHaveTextContent('6 runtime');
    expect(facts).toHaveTextContent('3 pace');
    expect(trigger).toHaveTextContent('All stints');

    fireEvent.click(trigger);
    fireEvent.click(driver.getByRole('option', { name: /All stints/ }));
    expect(facts).toHaveTextContent('0 runtime');
    expect(facts).toHaveTextContent('0 pace');
  });

  it('updates the global pace counts for every driver', () => {
    const laps = [
      makeLap({ id: 'clean', rowNumber: 1 }),
      makeLap({ id: 'unclean', rowNumber: 2, lapNumber: 2, clean: false }),
    ];
    render(<ScopeHarness laps={laps} />);
    const driver = within(driverCard('Alice'));

    expect(driver.getByLabelText('Alice scope facts')).toHaveTextContent('1 pace');
    fireEvent.click(screen.getByLabelText('Pace mode'));
    fireEvent.click(screen.getByRole('option', { name: 'All non-pit' }));

    expect(driver.getByLabelText('Alice scope facts')).toHaveTextContent('2 pace');
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

    const excludedStatuses = within(card).getAllByRole('button', { name: /Excluded:/ });
    expect(excludedStatuses.length).toBeGreaterThan(0);
    fireEvent.click(excludedStatuses[0]);

    expect(within(card).getByRole('dialog')).toHaveTextContent(/Inlap|Not clean|Outlap/);
    expect(within(card).queryByText(/pit-in|pit-out|Clean is false|row/)).not.toBeInTheDocument();
  });
});
