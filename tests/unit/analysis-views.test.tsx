import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Consistency } from '../../src/features/consistency/Consistency';
import { Drivers } from '../../src/features/drivers/Drivers';
import { Overview } from '../../src/features/overview/Overview';
import { pointsForReport } from '../../src/features/analysis/ProgressionChart';
import { Sectors } from '../../src/features/sectors/Sectors';
import { useAnalysisViewStore } from '../../src/state/analysis-view';
import { buildAnalysisReport } from '../../src/domain/analytics/report';
import { createDefaultScopeSelections } from '../../src/domain/analytics/stints';
import type { Lap, ParsedWorkbook } from '../../src/domain/model/normalized';
import { makeLap } from '../fixtures/scopeLaps';

function analysisReport(extraLaps: readonly Lap[] = []) {
  const laps: Lap[] = [
    makeLap({ id: 'alice-1', driver: 'Alice', lapNumber: 1 }),
    makeLap({
      id: 'alice-2',
      driver: 'Alice',
      lapNumber: 2,
      lapTimeUs: 10_200_000,
      sectorsUs: { S1: 5_100_000, S2: 5_100_000 },
    }),
    makeLap({
      id: 'bob-1',
      driver: 'Bob',
      lapNumber: 1,
      lapTimeUs: 11_000_000,
      sectorsUs: { S1: 5_500_000, S2: 5_500_000 },
    }),
    makeLap({
      id: 'bob-2',
      driver: 'Bob',
      lapNumber: 2,
      lapTimeUs: 11_200_000,
      sectorsUs: { S1: 5_600_000, S2: 5_600_000 },
    }),
    ...extraLaps,
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
      timedLapCount: laps.length,
      fullTimedLapCount: laps.length,
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

describe('M5 analysis views', () => {
  afterEach(cleanup);

  beforeEach(() => {
    useAnalysisViewStore.getState().setSectorBenchmark('median');
    useAnalysisViewStore.getState().setConsistencyMetric('sd');
    useAnalysisViewStore.getState().setSelectedDriver(null);
  });

  it('shows the full run register and multi-driver pace progression', async () => {
    const user = userEvent.setup();
    render(<Overview report={analysisReport()} />);

    expect(screen.getByText('Run register')).toBeInTheDocument();
    expect(screen.getByText('Pace progression')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByTitle('Fastest best pace')).toBeInTheDocument();
    expect(screen.getByTitle('Fastest median pace')).toBeInTheDocument();
    expect(screen.queryByText('Data quality')).not.toBeInTheDocument();
    expect(screen.queryByText('Sector leaders')).not.toBeInTheDocument();

    const drivers = screen.getByRole('button', { name: 'Drivers' });
    await user.click(drivers);
    await user.click(screen.getByRole('option', { name: 'Bob' }));

    expect(drivers).toHaveTextContent('Alice');
  });

  it('aligns completed laps and marks dirty and pit laps in progression data', () => {
    const report = analysisReport([
      makeLap({ id: 'alice-3', rowNumber: 3, lapNumber: 3, clean: false, pitIn: true }),
      makeLap({ id: 'alice-4', rowNumber: 4, lapNumber: 3, clean: false }),
      makeLap({
        id: 'bob-3',
        rowNumber: 3,
        driver: 'Bob',
        lapNumber: 3,
        clean: false,
      }),
    ]);
    const lapThreePoints = pointsForReport(report, ['Alice', 'Bob']).filter(
      (point) => point.lapNumber === 3,
    );

    expect(lapThreePoints).toHaveLength(2);
    expect(lapThreePoints[0]).toMatchObject({
      lapKey: '3:0',
      Alice: null,
      Bob: 10_000_000,
      Alice__dirty: null,
      Bob__dirty: 10_000_000,
    });
    expect(lapThreePoints[1]).toMatchObject({
      lapKey: '3:1',
      Alice: 10_000_000,
      Bob: null,
      Alice__dirty: 10_000_000,
      Bob__dirty: null,
    });
  });

  it('switches sector benchmarks and consistency metrics', async () => {
    const user = userEvent.setup();
    const report = analysisReport();
    render(
      <>
        <Sectors report={report} />
        <Consistency report={report} />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Benchmark' }));
    await user.click(screen.getByRole('option', { name: 'Average' }));
    await user.click(screen.getByRole('button', { name: 'Metric' }));
    await user.click(screen.getByRole('option', { name: 'MAD' }));

    expect(screen.getByText('Fastest Average')).toBeInTheDocument();
    expect(screen.getByText('Sector progression')).toBeInTheDocument();
    expect(screen.getByText(/selected MAD across drivers/i)).toBeInTheDocument();
  });

  it('switches driver detail from the shared driver control', async () => {
    const user = userEvent.setup();
    render(<Drivers report={analysisReport()} />);

    await user.click(screen.getByRole('button', { name: 'Driver' }));
    await user.click(screen.getByRole('option', { name: 'Bob' }));

    expect(screen.getByText('Bob pace progression')).toBeInTheDocument();
    expect(screen.getByText(/Bob's best actual lap/)).toBeInTheDocument();
  });
});
