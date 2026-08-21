import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs, formatGapUs } from '../../lib/durations';

type LeaderboardProps = {
  report: AnalysisReport;
};

function formatPercentage(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

export function Leaderboard({ report }: LeaderboardProps) {
  const rows = report.leaderboard;

  if (rows.length === 0) {
    return (
      <div className="leaderboard leaderboard--empty calibration-panel__advisory">
        <p>No completed runtime laps are available.</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard__table-wrap">
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
            {rows.map((row) => (
              <tr key={row.driver}>
                <th scope="row">{row.position}</th>
                <td className="leaderboard__driver">{row.driver}</td>
                <td>{formatDurationUs(row.runtimeUs)}</td>
                <td>{formatGapUs(row.gapUs)}</td>
                <td>{`${row.cleanLapCount} / ${row.eligibleNonPitLapCount}`}</td>
                <td>{formatPercentage(row.cleanPercentage)}</td>
                <td>{formatDurationUs(row.lapStats.bestUs)}</td>
                <td>{formatDurationUs(row.lapStats.medianUs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
