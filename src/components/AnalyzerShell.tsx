import { FileSpreadsheet, LockKeyhole, Ruler, ShieldCheck, Waypoints } from 'lucide-react';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';

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

export function AnalyzerShell() {
  const [activeTab, setActiveTab] = useState('overview');

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

        <Button variant="outline" size="sm" disabled>
          Export report
        </Button>
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

        <div className="calibration-sheet" aria-label="Comparison sheet waiting for files">
          <div className="calibration-sheet__topline">
            <span>Comparison sheet</span>
            <span>G61 / 001</span>
          </div>
          <div className="calibration-sheet__body">
            <div className="calibration-sheet__title-row">
              <div>
                <h2>Waiting for source files</h2>
              </div>
              <Waypoints aria-hidden="true" size={25} strokeWidth={1.5} />
            </div>
            <p>
              Add one or more local exports to open the measured comparison. Nothing leaves this
              browser.
            </p>

            <div className="calibration-sheet__readout" aria-label="Current analysis count">
              <div>
                <span>Drivers</span>
                <strong>00</strong>
              </div>
              <div>
                <span>Timed laps</span>
                <strong>00</strong>
              </div>
              <div>
                <span>Warnings</span>
                <strong>00</strong>
              </div>
            </div>

            <div className="calibration-dropzone" aria-label="XLSX import area">
              <FileSpreadsheet aria-hidden="true" size={27} strokeWidth={1.5} />
              <div>
                <strong>Drop .XLSX exports here</strong>
                <span>Multiple files accepted in the next step.</span>
              </div>
              <span className="calibration-dropzone__state">READY</span>
            </div>
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
            <h2 id="ledger-title">One report. Every lap accountable.</h2>
          </div>
          <span className="calibration-ledger__count">0 drivers / 0 laps</span>
        </div>

        <div className="calibration-ledger__table-wrap">
          <table className="calibration-table">
            <thead>
              <tr>
                <th scope="col">Driver</th>
                <th scope="col">Raw runtime</th>
                <th scope="col">Adjusted</th>
                <th scope="col">Evidence</th>
              </tr>
            </thead>
            <tbody>
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
              <h3>{tabs.find(([value]) => value === activeTab)?.[1]} waits for the register.</h3>
              <p>
                Import a workbook to populate this view from the same canonical report. The audit
                trail stays visible when the numbers get detailed.
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
