import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import { AnalysisSurface, metricValue, SelectControl } from '../analysis/AnalysisPrimitives';
import {
  useAnalysisViewStore,
  type ConsistencyMetric,
  type ConsistencyMode,
} from '../../state/analysis-view';

type ConsistencyProps = {
  report: AnalysisReport;
};

const modeOptions = [
  { value: 'sectors', label: 'Sectors' },
  { value: 'laps', label: 'Laps' },
] as const;

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
  const mode = useAnalysisViewStore((state) => state.consistencyMode);
  const setMode = useAnalysisViewStore((state) => state.setConsistencyMode);
  const metric = useAnalysisViewStore((state) => state.consistencyMetric);
  const setMetric = useAnalysisViewStore((state) => state.setConsistencyMetric);
  const drivers = report.leaderboard.map((row) => row.driver);
  const label = metricLabel(metric);
  const metricColumnLabel = metricOptions.find((option) => option.value === metric)?.label ?? label;
  const driverAnalyses = new Map(report.drivers.map((driver) => [driver.driver, driver]));

  return (
    <div className="analysis-view">
      <div className="analysis-controls" aria-label="Consistency controls">
        <SelectControl
          label="Mode"
          value={mode}
          options={modeOptions}
          onChange={(value) => setMode(value as ConsistencyMode)}
        />
        <SelectControl
          label="Metric"
          value={metric}
          options={metricOptions}
          onChange={(value) => setMetric(value as ConsistencyMetric)}
        />
      </div>

      {mode === 'sectors' ? (
        <>
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
                    <th scope="col" className="analysis-table__label">
                      Sector
                    </th>
                    {drivers.map((driver) => (
                      <th scope="col" className="analysis-table__value" key={driver}>
                        {driver}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.sectors.map((sector) => (
                    <tr key={sector.sector}>
                      <th scope="row" className="analysis-table__label">
                        {sector.sector}
                      </th>
                      {drivers.map((driver) => {
                        const entry = sector.drivers.find((item) => item.driver === driver);
                        return (
                          <td key={driver} className="analysis-table__value">
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
                    <th scope="col" className="analysis-table__label">
                      Driver
                    </th>
                    <th scope="col" className="analysis-table__value">
                      Mean {label}
                    </th>
                    <th scope="col" className="analysis-table__value">
                      Most consistent
                    </th>
                    <th scope="col" className="analysis-table__value">
                      Least consistent
                    </th>
                    <th scope="col" className="analysis-table__value">
                      IQR outliers
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driverName) => {
                    const summary = report.consistency.find((entry) => entry.driver === driverName);
                    const metricSummary = summary?.[metric];

                    return (
                      <tr key={driverName}>
                        <th scope="row" className="analysis-table__label">
                          {driverName}
                        </th>
                        <td className="analysis-table__value">
                          {formatDurationUs(metricSummary?.meanUs ?? null)}
                        </td>
                        <td className="analysis-table__value">
                          {metricSummary?.mostConsistentSector ?? '—'}
                        </td>
                        <td className="analysis-table__value">
                          {metricSummary?.leastConsistentSector ?? '—'}
                        </td>
                        <td className="analysis-table__value">{summary?.iqrOutlierCount ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AnalysisSurface>
        </>
      ) : (
        <AnalysisSurface className="analysis-surface--table">
          <div className="analysis-surface__header">
            <div>
              <h3>Lap consistency summary</h3>
              <p>Eligible pace laps show each driver&apos;s best, worst, and selected variation.</p>
            </div>
          </div>
          <div className="analysis-table-wrap">
            <table aria-label="Lap consistency summary">
              <thead>
                <tr>
                  <th scope="col" className="analysis-table__label">
                    Driver
                  </th>
                  <th scope="col" className="analysis-table__value">
                    N
                  </th>
                  <th scope="col" className="analysis-table__value">
                    Best lap
                  </th>
                  <th scope="col" className="analysis-table__value">
                    Worst lap
                  </th>
                  <th scope="col" className="analysis-table__value">
                    {metricColumnLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driverName) => {
                  const lapStats = driverAnalyses.get(driverName)?.lapStats;

                  return (
                    <tr key={driverName}>
                      <th scope="row" className="analysis-table__label">
                        {driverName}
                      </th>
                      <td className="analysis-table__value">{lapStats?.n ?? '—'}</td>
                      <td className="analysis-table__value">
                        {formatDurationUs(lapStats?.bestUs ?? null)}
                      </td>
                      <td className="analysis-table__value">
                        {formatDurationUs(lapStats?.worstUs ?? null)}
                      </td>
                      <td className="analysis-table__value">
                        {formatDurationUs(lapStats ? metricValue(lapStats, metric) : null)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AnalysisSurface>
      )}
    </div>
  );
}
