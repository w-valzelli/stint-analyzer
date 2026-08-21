import type { AnalysisReport, LeaderboardRow } from '../../domain/model/report';

type LeaderboardProps = {
  report: AnalysisReport;
};

function formatDuration(valueUs: number | null): string {
  return valueUs === null ? '—' : `${(valueUs / 1_000_000).toFixed(3)} s`;
}

function formatGap(valueUs: number): string {
  return valueUs === 0 ? '—' : `+${formatDuration(valueUs)}`;
}

function formatPercentage(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

function cleanLapsLabel(row: LeaderboardRow): string {
  return `${row.cleanLapCount} / ${row.eligibleNonPitLapCount}`;
}

export function Leaderboard({ report }: LeaderboardProps) {
  const rows = report.leaderboard;

  if (rows.length === 0) {
    return (
      <div className="leaderboard leaderboard--empty">
        <h3>Runtime standings.</h3>
        <p>No completed runtime laps are available in the selected scope.</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard__heading">
        <div>
          <h3>Runtime standings.</h3>
          <p>Rank by selected runtime. Clean status does not change runtime.</p>
        </div>
        <div className="leaderboard__facts" aria-label="Leaderboard facts">
          <span>
            <strong>{rows.length}</strong> drivers
          </span>
          <span>
            <strong>{report.sources.length}</strong> sources
          </span>
        </div>
      </div>

      <p className="leaderboard__note">
        Invalid laps count full timed non-pit laps with Clean set to 0. They remain part of runtime.
      </p>

      <div className="leaderboard__table-wrap">
        <table>
          <caption>Runtime standings for the selected scope</caption>
          <thead>
            <tr>
              <th scope="col">Pos</th>
              <th scope="col">Driver</th>
              <th scope="col">Runtime</th>
              <th scope="col">Gap</th>
              <th scope="col">Invalid laps</th>
              <th scope="col">Clean laps</th>
              <th scope="col">Clean %</th>
              <th scope="col">Best lap</th>
              <th scope="col">Median lap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.driver}>
                <th scope="row">{row.position}</th>
                <td className="leaderboard__driver">{row.driver}</td>
                <td>{formatDuration(row.runtimeUs)}</td>
                <td>{formatGap(row.gapUs)}</td>
                <td>{row.invalidLapCount}</td>
                <td aria-label={`${row.cleanLapCount} of ${row.eligibleNonPitLapCount} clean laps`}>
                  {cleanLapsLabel(row)}
                </td>
                <td>{formatPercentage(row.cleanPercentage)}</td>
                <td>{formatDuration(row.lapStats.bestUs)}</td>
                <td>{formatDuration(row.lapStats.medianUs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
