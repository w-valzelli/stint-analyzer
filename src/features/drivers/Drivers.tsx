import type { AnalysisReport, DriverSectorAnalysis } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import {
  AnalysisSurface,
  DriverControl,
  formatSignedDurationUs,
  useActiveDriver,
} from '../analysis/AnalysisPrimitives';
import { ProgressionChart } from '../analysis/ProgressionChart';
import { DriverScorecard } from './DriverScorecard';

type DriversProps = {
  report: AnalysisReport;
};

function sectorGapLabel(sector: DriverSectorAnalysis): string {
  return formatSignedDurationUs(sector.gapToBestMedianUs);
}

export function Drivers({ report }: DriversProps) {
  const selectedDriver = useActiveDriver(report);
  const driver = report.drivers.find((entry) => entry.driver === selectedDriver);

  if (!driver) {
    return <p className="analysis-empty">No driver with runtime laps is available.</p>;
  }

  return (
    <div className="analysis-view">
      <div className="analysis-controls" aria-label="Driver controls">
        <DriverControl report={report} />
      </div>

      <DriverScorecard driver={driver} driverCount={report.leaderboard.length} />

      <AnalysisSurface className="analysis-surface--table">
        <div className="analysis-surface__header">
          <div>
            <h3>Theoretical potential</h3>
            <p>Personal best sectors combined. This is not an actual lap.</p>
          </div>
        </div>
        <div className="analysis-comparison">
          <div>
            <span>Best actual</span>
            <strong>{formatDurationUs(driver.lapStats.bestUs)}</strong>
          </div>
          <div>
            <span>Theoretical best</span>
            <strong>{formatDurationUs(driver.theoreticalBestUs)}</strong>
          </div>
          <div>
            <span>Execution gap</span>
            <strong>{formatSignedDurationUs(driver.executionGapUs)}</strong>
          </div>
        </div>
      </AnalysisSurface>

      <AnalysisSurface className="analysis-surface--table">
        <div className="analysis-surface__header">
          <div>
            <h3>Sector detail</h3>
            <p>Ranks use the median benchmark. Gaps remain signed facts from the report.</p>
          </div>
        </div>
        <div className="analysis-table-wrap">
          <table aria-label={`${driver.driver} sector detail`}>
            <thead>
              <tr>
                <th scope="col">Sector</th>
                <th scope="col">Rank</th>
                <th scope="col">Best</th>
                <th scope="col">Mean</th>
                <th scope="col">Median</th>
                <th scope="col">SD</th>
                <th scope="col">MAD</th>
                <th scope="col">Gap to median</th>
              </tr>
            </thead>
            <tbody>
              {driver.sectors.map((sector) => (
                <tr key={sector.sector}>
                  <th scope="row">{sector.sector}</th>
                  <td>{sector.medianRank ?? '—'}</td>
                  <td>{formatDurationUs(sector.bestUs)}</td>
                  <td>{formatDurationUs(sector.meanUs)}</td>
                  <td>{formatDurationUs(sector.medianUs)}</td>
                  <td>{formatDurationUs(sector.sdUs)}</td>
                  <td>{formatDurationUs(sector.madUs)}</td>
                  <td>{sectorGapLabel(sector)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnalysisSurface>

      <ProgressionChart report={report} driver={driver.driver} />
    </div>
  );
}
