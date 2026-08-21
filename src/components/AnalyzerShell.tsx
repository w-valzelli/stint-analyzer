import { Download, GitFork, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';

import { ImportRegister, type ImportRegisterState } from '../features/import/ImportRegister';
import { ThemeControl } from './ThemeControl';
import { Button, buttonVariants } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const tabs = [
  ['overview', 'Overview'],
  ['leaderboard', 'Leaderboard'],
  ['sectors', 'Sectors'],
  ['consistency', 'Consistency'],
  ['drivers', 'Drivers'],
  ['audit', 'Audit'],
] as const;

const emptyImportState: ImportRegisterState = {
  records: [],
  workbooks: [],
  isProcessing: false,
};

export function AnalyzerShell() {
  const [activeTab, setActiveTab] = useState('overview');
  const [importState, setImportState] = useState<ImportRegisterState>(emptyImportState);
  const handleImportStateChange = useCallback((nextState: ImportRegisterState) => {
    setImportState(nextState);
  }, []);

  const laps = importState.workbooks.flatMap((workbook) => workbook.laps);
  const driverNames = [...new Set(laps.map((lap) => lap.driver))].sort((left, right) =>
    left.localeCompare(right),
  );
  const hasWorkbooks = importState.workbooks.length > 0;

  return (
    <main className="calibration-app">
      <header className="calibration-header">
        <a className="calibration-mark" href="#top" aria-label="Stint Analyzer home">
          <h2 className="calibration-mark__name" aria-label="Stint Analyzer">
            <strong>STINT</strong>
            <span>ANALYZER</span>
          </h2>
        </a>

        <div className="calibration-header__actions">
          <a
            className={buttonVariants({
              treatment: 'control',
              tone: 'neutral',
              size: 'sm',
              content: 'icon',
            })}
            href="https://github.com/w-valzelli/stint-analyzer"
            target="_blank"
            rel="noreferrer"
            aria-label="View source on GitHub"
            title="View source on GitHub"
          >
            <GitFork aria-hidden="true" size={16} strokeWidth={1.8} />
          </a>
          <ThemeControl />
        </div>
      </header>

      <section className="calibration-intro" id="top" aria-labelledby="page-title">
        <div className="calibration-intro__copy">
          <h1 id="page-title">
            Compare the run
            <span>before you coach it.</span>
          </h1>
          <p className="calibration-intro__lede">
            Add Garage 61 workbooks. Review the detected drivers and laps, then compare the runs
            that matter.
          </p>
        </div>

        <div
          className="calibration-sheet"
          aria-label={hasWorkbooks ? 'Source files ready' : 'Source files waiting for import'}
        >
          <div className="calibration-sheet__body">
            <div className="calibration-sheet__heading">
              <div>
                <h2>Source files</h2>
                <p>
                  {hasWorkbooks
                    ? 'Review the detected drivers and laps before selecting a scope.'
                    : 'Choose one or more Garage 61 files to begin.'}
                </p>
              </div>
            </div>

            <ImportRegister onStateChange={handleImportStateChange} />
          </div>
        </div>
      </section>

      <section className="calibration-ledger" aria-labelledby="ledger-title">
        <div className="calibration-ledger__heading">
          <div>
            <h2 id="ledger-title">Detected drivers and laps.</h2>
          </div>
          <span className="calibration-ledger__count">
            {driverNames.length} drivers / {laps.length} rows
          </span>
        </div>

        <div className="calibration-ledger__table-wrap">
          <table className="calibration-table">
            <thead>
              <tr>
                <th scope="col">Driver</th>
                <th scope="col">Source files</th>
                <th scope="col">Full timed laps</th>
                <th scope="col">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {driverNames.length === 0 ? (
                <tr className="calibration-table__empty">
                  <th scope="row">
                    <span className="calibration-table__marker" aria-hidden="true" />
                    Source files required
                  </th>
                  <td>—</td>
                  <td>—</td>
                  <td>
                    <span className="calibration-table__trace">
                      <ShieldCheck aria-hidden="true" size={14} />
                      Audit trail opens here
                    </span>
                  </td>
                </tr>
              ) : (
                driverNames.map((driver) => {
                  const driverLaps = laps.filter((lap) => lap.driver === driver);
                  const sourceCount = new Set(driverLaps.map((lap) => lap.sourceFileId)).size;
                  const sectorCount = new Set(
                    driverLaps.flatMap((lap) => Object.keys(lap.sectorsUs)),
                  ).size;
                  return (
                    <tr key={driver}>
                      <th scope="row">{driver}</th>
                      <td>{sourceCount}</td>
                      <td>{driverLaps.filter((lap) => lap.isFullTimedLap).length}</td>
                      <td>
                        <span className="calibration-table__trace">
                          <ShieldCheck aria-hidden="true" size={14} />
                          {sectorCount} sectors available
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="calibration-index" aria-labelledby="index-title">
        <div className="calibration-index__heading">
          <div>
            <h2 id="index-title">Analysis views</h2>
          </div>
          <Button treatment="outline" tone="neutral" size="sm" disabled>
            <Download aria-hidden="true" size={14} />
            Export report
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList aria-label="Analysis sections">
            {tabs.map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="calibration-panel">
              <h3>
                {hasWorkbooks
                  ? `${tabs.find(([value]) => value === activeTab)?.[1]} will use the imported source data.`
                  : `${tabs.find(([value]) => value === activeTab)?.[1]} waits for source files.`}
              </h3>
              <p>
                {hasWorkbooks
                  ? 'The source rows are ready. Scope and report calculations arrive in the next analysis steps.'
                  : 'Import a workbook to populate this view from the same canonical report. The audit trail stays visible when the numbers get detailed.'}
              </p>
              <div className="calibration-panel__rule" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <footer className="calibration-footer">
        <span>Stint Analyzer</span>
        <span>All workbook data stays in your browser.</span>
      </footer>
    </main>
  );
}

export default AnalyzerShell;
