import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import { AnalysisSurface, metricValue, SelectControl } from '../analysis/AnalysisPrimitives';
import { useAnalysisViewStore, type ConsistencyMetric } from '../../state/analysis-view';

type ConsistencyProps = {
  report: AnalysisReport;
};

const metricOptions = [
  { value: 'sd', label: 'Population SD' },
  { value: 'mad', label: 'MAD' },
  { value: 'iqr', label: 'IQR' },
  { value: 'range', label: 'Range' },
] as const;

function metricLabel(metric: ConsistencyMetric): string {
  return metric === 'sd'
    ? 'population SD'
    : metric === 'mad'
      ? 'MAD'
      : metric === 'iqr'
        ? 'IQR'
        : 'range';
}

export function Consistency({ report }: ConsistencyProps) {
  const metric = useAnalysisViewStore((state) => state.consistencyMetric);
  const setMetric = useAnalysisViewStore((state) => state.setConsistencyMetric);
  const drivers = report.leaderboard.map((row) => row.driver);
  const label = metricLabel(metric);

  return (
    <div className="analysis-view">
      <div className="analysis-controls" aria-label="Consistency controls">
        <SelectControl
          label="Metric"
          value={metric}
          options={metricOptions}
          onChange={(value) => setMetric(value as ConsistencyMetric)}
        />
        <p className="analysis-control-note">Lower values show more repeatable sectors.</p>
      </div>

      <AnalysisSurface className="analysis-surface--table">
        <div className="analysis-surface__header">
          <div>
            <h3>Consistency matrix</h3>
            <p>Sector rows compare the selected {label} across drivers.</p>
          </div>
          <span className="analysis-surface__count">{drivers.length} drivers</span>
        </div>
        <div className="analysis-table-wrap">
          <table aria-label="Consistency matrix">
            <thead>
              <tr>
                <th scope="col">Sector</th>
                {drivers.map((driver) => (
                  <th scope="col" key={driver}>
                    {driver}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.sectors.map((sector) => (
                <tr key={sector.sector}>
                  <th scope="row">{sector.sector}</th>
                  {drivers.map((driver) => {
                    const entry = sector.drivers.find((item) => item.driver === driver);
                    return (
                      <td key={driver}>
                        {entry ? formatDurationUs(metricValue(entry, metric)) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnalysisSurface>

      <AnalysisSurface className="analysis-surface--table">
        <div className="analysis-surface__header">
          <div>
            <h3>Driver summary</h3>
            <p>Mean, sector extremes, and IQR flags come from the canonical report.</p>
          </div>
        </div>
        <div className="analysis-table-wrap">
          <table aria-label="Driver consistency summary">
            <thead>
              <tr>
                <th scope="col">Driver</th>
                <th scope="col">Mean {label}</th>
                <th scope="col">Most consistent</th>
                <th scope="col">Least consistent</th>
                <th scope="col">IQR outliers</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driverName) => {
                const summary = report.consistency.find((entry) => entry.driver === driverName);
                const metricSummary = summary?.[metric];

                return (
                  <tr key={driverName}>
                    <th scope="row">{driverName}</th>
                    <td>{formatDurationUs(metricSummary?.meanUs ?? null)}</td>
                    <td>{metricSummary?.mostConsistentSector ?? '—'}</td>
                    <td>{metricSummary?.leastConsistentSector ?? '—'}</td>
                    <td>{summary?.iqrOutlierCount ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AnalysisSurface>
    </div>
  );
}
