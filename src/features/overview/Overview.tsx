import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs, formatGapUs } from '../../lib/durations';
import { AnalysisSurface, MetricStrip } from '../analysis/AnalysisPrimitives';
import { ProgressionChart } from '../analysis/ProgressionChart';

type OverviewProps = {
  report: AnalysisReport;
};

function fastestMetric(report: AnalysisReport, field: 'bestUs' | 'medianUs'): number | null {
  const values = report.leaderboard
    .map((row) => row.lapStats[field])
    .filter((value): value is number => value !== null);
  return values.length === 0 ? null : Math.min(...values);
}

export function Overview({ report }: OverviewProps) {
  const runtimeLapCount = report.leaderboard.reduce((total, row) => total + row.runtimeLapCount, 0);
  const paceLapCount = report.leaderboard.reduce((total, row) => total + row.paceLapCount, 0);
  const bestLapUs = fastestMetric(report, 'bestUs');
  const medianLapUs = fastestMetric(report, 'medianUs');
  const warningCount = report.warnings.length;

  return (
    <div className="analysis-view">
      <MetricStrip
        items={[
          { label: 'Drivers', value: String(report.leaderboard.length) },
          { label: 'Source files', value: String(report.sources.length) },
          { label: 'Runtime laps', value: String(runtimeLapCount) },
          { label: 'Pace laps', value: String(paceLapCount), detail: report.configuration.paceMode },
          { label: 'Fastest best', value: formatDurationUs(bestLapUs) },
          { label: 'Fastest median', value: formatDurationUs(medianLapUs) },
          { label: 'Warnings', value: String(warningCount) },
        ]}
      />

      <div className="analysis-overview-grid">
        <AnalysisSurface className="analysis-surface--table">
          <div className="analysis-surface__header">
            <div>
              <h3>Run register</h3>
              <p>Runtime standings and the pace facts that support them.</p>
            </div>
          </div>
          <div className="analysis-table-wrap">
            <table aria-label="Overview run register">
              <thead>
                <tr>
                  <th scope="col">Pos</th>
                  <th scope="col">Driver</th>
                  <th scope="col">Runtime</th>
                  <th scope="col">Gap</th>
                  <th scope="col">Pace laps</th>
                  <th scope="col">Median pace</th>
                </tr>
              </thead>
              <tbody>
                {report.leaderboard.slice(0, 5).map((row) => (
                  <tr key={row.driver}>
                    <th scope="row">{row.position}</th>
                    <td className="analysis-table__emphasis">{row.driver}</td>
                    <td>{formatDurationUs(row.runtimeUs)}</td>
                    <td>{formatGapUs(row.gapUs)}</td>
                    <td>{row.paceLapCount}</td>
                    <td>{formatDurationUs(row.lapStats.medianUs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnalysisSurface>

        <AnalysisSurface>
          <div className="analysis-surface__header">
            <div>
              <h3>Data quality</h3>
              <p>{warningCount === 0 ? 'No warnings were raised for this report.' : `${warningCount} warning${warningCount === 1 ? '' : 's'} need review.`}</p>
            </div>
          </div>
          {warningCount === 0 ? (
            <p className="analysis-status analysis-status--ready">Report checks are clear.</p>
          ) : (
            <ul className="analysis-warning-list">
              {report.warnings.slice(0, 6).map((warning, index) => (
                <li key={`${warning.code}-${warning.rowNumber ?? index}`}>
                  <span>{warning.severity}</span>
                  <p>{warning.message}</p>
                </li>
              ))}
            </ul>
          )}
        </AnalysisSurface>
      </div>

      <ProgressionChart report={report} />
    </div>
  );
}
