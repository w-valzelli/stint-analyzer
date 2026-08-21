import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildAnalysisReport } from '../../src/domain/analytics/report';
import { createDefaultScopeSelections } from '../../src/domain/analytics/stints';
import type { Lap, ParsedWorkbook } from '../../src/domain/model/normalized';
import { Leaderboard } from '../../src/features/leaderboard/Leaderboard';
import { makeLap } from '../fixtures/scopeLaps';

function leaderboardReport() {
  const laps: Lap[] = [
    makeLap({
      id: 'alice-1',
      driver: 'Alice',
      lapNumber: 1,
      lapTimeUs: 10_000_000,
      sectorsUs: { S1: 5_000_000, S2: 5_000_000 },
    }),
    makeLap({
      id: 'bob-1',
      driver: 'Bob',
      lapNumber: 1,
      lapTimeUs: 13_000_000,
      clean: false,
      sectorsUs: { S1: 6_000_000, S2: 7_000_000 },
    }),
  ];
  const workbook: ParsedWorkbook = {
    source: {
      id: 'a'.repeat(64),
      name: 'session.xlsx',
      hash: 'a'.repeat(64),
      sheetName: 'Session - Practice',
      driverName: 'Alice, Bob',
      trackName: 'Synthetic Ring',
      carName: 'Prototype X',
      driverNames: ['Alice', 'Bob'],
      sectorNames: ['S1', 'S2'],
      timedLapCount: 2,
      fullTimedLapCount: 2,
      partialLapCount: 0,
      warningCount: 0,
    },
    laps,
    warnings: [],
  };

  return buildAnalysisReport({
    workbooks: [workbook],
    selections: createDefaultScopeSelections(laps),
    paceMode: 'clean-non-pit',
    generatedAt: '2026-08-21T12:00:00.000Z',
  });
}

describe('Leaderboard', () => {
  it('shows runtime order, gaps, and factual lap-quality counts', () => {
    render(<Leaderboard report={leaderboardReport()} />);

    expect(screen.getByRole('heading', { name: 'Runtime standings.' })).toBeInTheDocument();
    expect(
      screen.getByText('Rank by selected runtime. Clean status does not change runtime.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Invalid laps count full timed non-pit laps/)).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Runtime standings for the selected scope' });
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent(
      /1\s*Alice\s*10\.000 s\s*—\s*0\s*1 \/ 1\s*100\.0%\s*10\.000 s\s*10\.000 s/,
    );
    expect(rows[2]).toHaveTextContent(
      /2\s*Bob\s*13\.000 s\s*\+3\.000 s\s*1\s*0 \/ 1\s*0\.0%\s*—\s*—/,
    );
    expect(table).not.toHaveTextContent('penalty');
  });
});
