import { LockKeyhole, RotateCcw, Ruler, ShieldCheck, Waypoints } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import {
  ImportRegister,
  type ImportRegisterHandle,
  type ImportRegisterState,
} from '../features/import/ImportRegister';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const tabs = [
  ['overview', 'Overview'],
  ['leaderboard', 'Leaderboard'],
  ['sectors', 'Sectors'],
  ['consistency', 'Consistency'],
  ['drivers', 'Drivers'],
  ['audit', 'Audit'],
] as const;

const workflow = [
  ['Register', 'local files'],
  ['Compare', 'selected runs'],
  ['Trace', 'source laps'],
] as const;

const emptyImportState: ImportRegisterState = {
  records: [],
  workbooks: [],
  isProcessing: false,
};

export function AnalyzerShell() {
  const [activeTab, setActiveTab] = useState('overview');
  const [importState, setImportState] = useState<ImportRegisterState>(emptyImportState);
  const importRegisterRef = useRef<ImportRegisterHandle>(null);
  const handleImportStateChange = useCallback((nextState: ImportRegisterState) => {
    setImportState(nextState);
  }, []);

  const laps = importState.workbooks.flatMap((workbook) => workbook.laps);
  const driverNames = [...new Set(laps.map((lap) => lap.driver))].sort((left, right) =>
    left.localeCompare(right),
  );
  const fullTimedLaps = laps.filter((lap) => lap.isFullTimedLap);
  const parserWarningCount = importState.records.reduce(
    (total, record) => total + record.warnings.length,
    0,
  );
  const attentionCount = importState.records.filter(
    (record) =>
      record.status === 'duplicate' || record.status === 'error' || record.status === 'rejected',
  ).length;
  const warningCount = parserWarningCount + attentionCount;
  const hasRecords = importState.records.length > 0;
  const hasWorkbooks = importState.workbooks.length > 0;

  return (
    <main className="calibration-app">
      <header className="calibration-header">
        <a className="calibration-mark" href="#top" aria-label="Garage 61 Stint Analyzer home">
          <span className="calibration-mark__badge">G61</span>
          <h2 className="calibration-mark__name" aria-label="Garage 61 Stint Analyzer">
            <strong>Garage 61</strong>
            <span>Stint Analyzer</span>
          </h2>
        </a>

        <div className="calibration-header__status" aria-label="Analysis privacy status">
          <span className="calibration-status-dot" aria-hidden="true" />
          <LockKeyhole aria-hidden="true" size={14} />
          <span>Local / ephemeral</span>
        </div>

        <div className="calibration-header__actions">
          {hasRecords && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => importRegisterRef.current?.reset()}
              aria-label="Reset registered files"
            >
              <RotateCcw aria-hidden="true" size={14} />
              Reset
            </Button>
          )}
          <Button variant="outline" size="sm" disabled>
            Export report
          </Button>
        </div>
      </header>

      <section className="calibration-intro" id="top" aria-labelledby="page-title">
        <div className="calibration-intro__copy">
          <h1 id="page-title">
            Compare the run
            <span>before you coach it.</span>
          </h1>
          <p className="calibration-intro__lede">
            Register Garage 61 workbooks locally. See the driver gap first, then follow every result
            back to the laps that produced it.
          </p>

          <div className="calibration-workflow" aria-label="Analysis workflow">
            {workflow.map(([label, detail], index) => (
              <div className="calibration-workflow__step" key={label}>
                <span className="calibration-workflow__mark" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="calibration-sheet"
          aria-label={
            hasWorkbooks
              ? 'Comparison sheet with registered files'
              : 'Comparison sheet waiting for files'
          }
        >
          <div className="calibration-sheet__topline">
            <span>Comparison sheet</span>
            <span>G61 / 001</span>
          </div>
          <div className="calibration-sheet__body">
            <div className="calibration-sheet__title-row">
              <div>
                <h2>{hasWorkbooks ? 'Source register ready' : 'Waiting for source files'}</h2>
              </div>
              <Waypoints aria-hidden="true" size={25} strokeWidth={1.5} />
            </div>
            <p>
              {hasWorkbooks
                ? 'The app found local workbook data. Review the source rows before scope and pace analysis.'
                : 'Add one or more local exports to open the measured comparison. Nothing leaves this browser.'}
            </p>

            <div className="calibration-sheet__readout" aria-label="Current analysis count">
              <div>
                <span>Drivers</span>
                <strong>{String(driverNames.length).padStart(2, '0')}</strong>
              </div>
              <div>
                <span>Full timed laps</span>
                <strong>{String(fullTimedLaps.length).padStart(2, '0')}</strong>
              </div>
              <div>
                <span>Warnings</span>
                <strong>{String(warningCount).padStart(2, '0')}</strong>
              </div>
            </div>

            <ImportRegister ref={importRegisterRef} onStateChange={handleImportStateChange} />
          </div>
          <div className="calibration-sheet__footer">
            <span>Clean is not a penalty</span>
            <span>Runtime and pace stay separate</span>
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
                          {sectorCount} sectors registered
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
            <h2 id="index-title">Choose a view when the sheet is registered.</h2>
          </div>
          <Ruler aria-hidden="true" size={24} strokeWidth={1.5} />
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
                  ? `${tabs.find(([value]) => value === activeTab)?.[1]} will use the registered report.`
                  : `${tabs.find(([value]) => value === activeTab)?.[1]} waits for the register.`}
              </h3>
              <p>
                {hasWorkbooks
                  ? 'Milestone 1 has registered the source rows. Scope and report calculations arrive in the next analysis steps.'
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
        <span>Garage 61 Stint Analyzer</span>
        <span>No account. No upload. Analyze locally and export when done.</span>
      </footer>
    </main>
  );
}

export default AnalyzerShell;
