import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs, formatGapUs } from '../../lib/durations';
import { AnalysisSurface, MetricStrip } from '../analysis/AnalysisPrimitives';
import { ProgressionChart } from '../analysis/ProgressionChart';

type OverviewProps = {
  report: AnalysisReport;
};

export function Overview({ report }: OverviewProps) {
  const overview = report.overview;

  return (
    <div className="analysis-view">
      <MetricStrip
        items={[
          { label: 'Drivers', value: String(overview.driverCount) },
          { label: 'Source files', value: String(overview.sourceFileCount) },
          { label: 'Runtime laps', value: String(overview.runtimeLapCount) },
          {
            label: 'Pace laps',
            value: String(overview.paceLapCount),
            detail: report.configuration.paceMode,
          },
          { label: 'Fastest best', value: formatDurationUs(overview.fastestBestUs) },
          { label: 'Fastest median', value: formatDurationUs(overview.fastestMedianUs) },
          { label: 'Warnings', value: String(overview.warningCount) },
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
              <p>
                {overview.warningCount === 0
                  ? 'No warnings were raised for this report.'
                  : `${overview.warningCount} warning${overview.warningCount === 1 ? '' : 's'} need review.`}
              </p>
            </div>
          </div>
          {overview.warningCount === 0 ? (
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

        <AnalysisSurface className="analysis-surface--table">
          <div className="analysis-surface__header">
            <div>
              <h3>Sector leaders</h3>
              <p>Median sector leaders use the selected pace sample.</p>
            </div>
          </div>
          <div className="analysis-table-wrap">
            <table aria-label="Median sector leaders">
              <thead>
                <tr>
                  <th scope="col">Sector</th>
                  <th scope="col">Leader</th>
                  <th scope="col">Median</th>
                </tr>
              </thead>
              <tbody>
                {overview.sectorLeaders.map((leader) => (
                  <tr key={leader.sector}>
                    <th scope="row">{leader.sector}</th>
                    <td className="analysis-table__emphasis">
                      {leader.drivers.length > 0 ? leader.drivers.join(', ') : '—'}
                    </td>
                    <td>{formatDurationUs(leader.bestMedianUs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnalysisSurface>
      </div>

      <ProgressionChart report={report} />
    </div>
  );
}
