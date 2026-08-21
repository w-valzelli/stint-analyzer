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
  it('shows only the runtime comparison table', () => {
    render(<Leaderboard report={leaderboardReport()} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText(/Invalid laps/)).not.toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Leaderboard' });
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent(
      /1\s*Alice\s*0:10\.000\s*—\s*1 \/ 1\s*100\.0%\s*0:10\.000\s*0:10\.000/,
    );
    expect(rows[2]).toHaveTextContent(/2\s*Bob\s*0:13\.000\s*\+0:03\.000\s*0 \/ 1\s*0\.0%\s*—\s*—/);
    expect(screen.getByText('Best pace')).toBeInTheDocument();
    expect(screen.getByText('Median pace')).toBeInTheDocument();
    expect(table).not.toHaveTextContent('penalty');
  });
});
