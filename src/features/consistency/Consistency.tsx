import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import {
  AnalysisSurface,
  formatPercentage,
  metricValue,
  SelectControl,
} from '../analysis/AnalysisPrimitives';
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

function mean(values: readonly (number | null)[]): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length === 0
    ? null
    : available.reduce((total, value) => total + value, 0) / available.length;
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
                    return <td key={driver}>{entry ? formatDurationUs(metricValue(entry, metric)) : '—'}</td>;
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
            <p>Mean consistency uses the available sector samples for each driver.</p>
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
                <th scope="col">Within 100 ms</th>
                <th scope="col">IQR outliers</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driverName) => {
                const entries = report.sectors
                  .map((sector) => ({
                    sector: sector.sector,
                    entry: sector.drivers.find((item) => item.driver === driverName),
                  }))
                  .filter((item): item is { sector: string; entry: NonNullable<typeof item.entry> } => Boolean(item.entry));
                const ranked = entries
                  .map(({ sector, entry }) => ({ sector, value: metricValue(entry, metric) }))
                  .filter((item): item is { sector: string; value: number } => item.value !== null)
                  .sort((left, right) => left.value - right.value || left.sector.localeCompare(right.sector));
                const driver = report.drivers.find((item) => item.driver === driverName);
                const within100 = mean(
                  report.sectors
                    .map((sector) => sector.drivers.find((item) => item.driver === driverName)?.pctWithin100msOfMedian ?? null),
                );
                const outliers = report.sectors.reduce(
                  (total, sector) =>
                    total + (sector.drivers.find((item) => item.driver === driverName)?.outlierCountIqr ?? 0),
                  0,
                );

                return (
                  <tr key={driverName}>
                    <th scope="row">{driverName}</th>
                    <td>{formatDurationUs(mean(ranked.map((item) => item.value)))}</td>
                    <td>{ranked[0] ? `${ranked[0].sector} · ${formatDurationUs(ranked[0].value)}` : '—'}</td>
                    <td>
                      {ranked.at(-1)
                        ? `${ranked.at(-1)?.sector} · ${formatDurationUs(ranked.at(-1)?.value ?? null)}`
                        : '—'}
                    </td>
                    <td>{formatPercentage(within100)}</td>
                    <td>{driver?.sectors.reduce((total, sector) => total + sector.outlierCountIqr, 0) ?? outliers}</td>
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
