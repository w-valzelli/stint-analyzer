import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import {
  AnalysisSurface,
  DriverControl,
  formatSignedDurationUs,
  SelectControl,
  useActiveDriver,
} from '../analysis/AnalysisPrimitives';
import { SectorProgressionChart } from '../analysis/SectorProgressionChart';
import { useAnalysisViewStore, type SectorBenchmark } from '../../state/analysis-view';

type SectorsProps = {
  report: AnalysisReport;
};

const benchmarkOptions = [
  { value: 'median', label: 'Median' },
  { value: 'average', label: 'Average' },
  { value: 'best', label: 'Best' },
] as const;

function benchmarkLabel(benchmark: SectorBenchmark): string {
  return benchmark === 'average' ? 'Average' : benchmark === 'best' ? 'Best' : 'Median';
}

function benchmarkValue(
  sector: AnalysisReport['sectors'][number],
  benchmark: SectorBenchmark,
): number | null {
  return benchmark === 'average'
    ? sector.benchmark.bestMeanUs
    : benchmark === 'best'
      ? sector.benchmark.bestSingleUs
      : sector.benchmark.bestMedianUs;
}

function driverGap(
  driver: AnalysisReport['sectors'][number]['drivers'][number],
  benchmark: SectorBenchmark,
): number | null {
  return benchmark === 'average'
    ? driver.gapToBestMeanUs
    : benchmark === 'best'
      ? driver.gapToBestSingleUs
      : driver.gapToBestMedianUs;
}

function paceModeLabel(report: AnalysisReport): string {
  return report.configuration.paceMode === 'clean-non-pit' ? 'Clean non-pit' : 'All non-pit';
}

export function Sectors({ report }: SectorsProps) {
  const benchmark = useAnalysisViewStore((state) => state.sectorBenchmark);
  const setBenchmark = useAnalysisViewStore((state) => state.setSectorBenchmark);
  const selectedDriver = useActiveDriver(report);
  const drivers = report.leaderboard.map((row) => row.driver);
  const selectedBenchmarkLabel = benchmarkLabel(benchmark);
  const selectedSectorEntries = report.sectors.flatMap((sector) =>
    sector.drivers
      .filter((driver) => driver.driver === selectedDriver)
      .map((driver) => ({ sector: sector.sector, driver })),
  );

  return (
    <div className="analysis-view">
      <div className="analysis-controls" aria-label="Sector controls">
        <SelectControl
          label="Benchmark"
          value={benchmark}
          options={benchmarkOptions}
          onChange={(value) => setBenchmark(value as SectorBenchmark)}
        />
        <DriverControl report={report} />
        <p className="analysis-control-note">
          Pace mode <strong>{paceModeLabel(report)}</strong>
        </p>
      </div>

      <AnalysisSurface className="analysis-surface--table">
        <div className="analysis-surface__header">
          <div>
            <h3>Sector benchmark matrix</h3>
            <p>Signed gaps show time from the fastest {selectedBenchmarkLabel.toLowerCase()}.</p>
          </div>
          <span className="analysis-surface__count">{drivers.length} drivers</span>
        </div>
        <div className="analysis-table-wrap">
          <table aria-label="Sector benchmark matrix">
            <thead>
              <tr>
                <th scope="col">Sector</th>
                <th scope="col">Fastest {selectedBenchmarkLabel}</th>
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
                  <td>{formatDurationUs(benchmarkValue(sector, benchmark))}</td>
                  {drivers.map((driver) => {
                    const entry = sector.drivers.find((item) => item.driver === driver);
                    return (
                      <td key={driver}>
                        {formatSignedDurationUs(entry ? driverGap(entry, benchmark) : null)}
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
            <h3>Sector detail</h3>
            <p>Each value uses the selected pace sample. N keeps small samples visible.</p>
          </div>
        </div>
        <div className="analysis-table-wrap">
          <table aria-label="Sector detail table">
            <thead>
              <tr>
                <th scope="col">Driver</th>
                <th scope="col">Sector</th>
                <th scope="col">N</th>
                <th scope="col">Best</th>
                <th scope="col">Mean</th>
                <th scope="col">Median</th>
                <th scope="col">SD</th>
                <th scope="col">MAD</th>
                <th scope="col">IQR</th>
                <th scope="col">Gap</th>
              </tr>
            </thead>
            <tbody>
              {selectedSectorEntries.map(({ sector, driver }) => (
                <tr key={`${driver.driver}-${sector}`}>
                  <th scope="row">{driver.driver}</th>
                  <td>{sector}</td>
                  <td>{driver.n}</td>
                  <td>{formatDurationUs(driver.bestUs)}</td>
                  <td>{formatDurationUs(driver.meanUs)}</td>
                  <td>{formatDurationUs(driver.medianUs)}</td>
                  <td>{formatDurationUs(driver.sdUs)}</td>
                  <td>{formatDurationUs(driver.madUs)}</td>
                  <td>{formatDurationUs(driver.iqrUs)}</td>
                  <td>{formatSignedDurationUs(driverGap(driver, benchmark))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnalysisSurface>

      <SectorProgressionChart report={report} driver={selectedDriver} />
    </div>
  );
}
