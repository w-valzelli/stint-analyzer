import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs, formatGapUs } from '../../lib/durations';

type LeaderboardProps = {
  report: AnalysisReport;
};

function formatPercentage(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

function fastestValue(rows: AnalysisReport['leaderboard'], metric: 'bestUs' | 'medianUs') {
  return rows.reduce<number | null>((fastest, row) => {
    const value = row.lapStats[metric];
    if (value === null) {
      return fastest;
    }
    return fastest === null ? value : Math.min(fastest, value);
  }, null);
}

function isFastest(value: number | null, fastest: number | null): boolean {
  return value !== null && value === fastest;
}

export function Leaderboard({ report }: LeaderboardProps) {
  const rows = report.leaderboard;
  const fastestBestUs = fastestValue(rows, 'bestUs');
  const fastestMedianUs = fastestValue(rows, 'medianUs');

  if (rows.length === 0) {
    return (
      <div className="leaderboard leaderboard--empty calibration-panel__advisory">
        <p>No completed runtime laps are available.</p>
      </div>
    );
  }

  return (
    <div className="analysis-table-wrap leaderboard">
      <table aria-label="Leaderboard">
        <thead>
          <tr>
            <th scope="col">Pos</th>
            <th scope="col">Driver</th>
            <th scope="col">Runtime</th>
            <th scope="col">Gap</th>
            <th scope="col">Clean laps</th>
            <th scope="col">Clean %</th>
            <th scope="col">Best pace</th>
            <th scope="col">Median pace</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const bestIsFastest = isFastest(row.lapStats.bestUs, fastestBestUs);
            const medianIsFastest = isFastest(row.lapStats.medianUs, fastestMedianUs);

            return (
              <tr key={row.driver}>
                <th scope="row">{row.position}</th>
                <td className="analysis-table__emphasis">{row.driver}</td>
                <td>{formatDurationUs(row.runtimeUs)}</td>
                <td>{formatGapUs(row.gapUs)}</td>
                <td>{`${row.cleanLapCount} / ${row.eligibleNonPitLapCount}`}</td>
                <td>{formatPercentage(row.cleanPercentage)}</td>
                <td
                  className={bestIsFastest ? 'analysis-table__fastest' : undefined}
                  title={bestIsFastest ? 'Fastest best pace' : undefined}
                  aria-label={
                    bestIsFastest
                      ? `${formatDurationUs(row.lapStats.bestUs)} fastest best pace`
                      : undefined
                  }
                >
                  {formatDurationUs(row.lapStats.bestUs)}
                </td>
                <td
                  className={medianIsFastest ? 'analysis-table__fastest' : undefined}
                  title={medianIsFastest ? 'Fastest median pace' : undefined}
                  aria-label={
                    medianIsFastest
                      ? `${formatDurationUs(row.lapStats.medianUs)} fastest median pace`
                      : undefined
                  }
                >
                  {formatDurationUs(row.lapStats.medianUs)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
