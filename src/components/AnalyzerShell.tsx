import { Download, GitFork } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { deriveLapEligibility } from '../domain/analytics/eligibility';
import { buildAnalysisReport } from '../domain/analytics/report';
import {
  detectStints,
  groupLapsByDriver,
  reconcileScopeSelections,
} from '../domain/analytics/stints';
import type { PaceMode, ScopeSelection } from '../domain/model/scope';
import { ImportRegister, type ImportRegisterState } from '../features/import/ImportRegister';
import { ScopeReview } from '../features/scope/ScopeReview';
import { ThemeControl } from './ThemeControl';
import { Button, buttonVariants } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const tabs = [
  ['overview', 'Overview'],
  ['sectors', 'Sectors'],
  ['consistency', 'Consistency'],
  ['drivers', 'Driver scorecard'],
] as const;

const Overview = lazy(() =>
  import('../features/overview/Overview').then(({ Overview: component }) => ({
    default: component,
  })),
);
const Sectors = lazy(() =>
  import('../features/sectors/Sectors').then(({ Sectors: component }) => ({ default: component })),
);
const Consistency = lazy(() =>
  import('../features/consistency/Consistency').then(({ Consistency: component }) => ({
    default: component,
  })),
);
const Drivers = lazy(() =>
  import('../features/drivers/Drivers').then(({ Drivers: component }) => ({ default: component })),
);

const emptyImportState: ImportRegisterState = {
  records: [],
  workbooks: [],
  isProcessing: false,
};

export function AnalyzerShell() {
  const [activeTab, setActiveTab] = useState('overview');
  const [importState, setImportState] = useState<ImportRegisterState>(emptyImportState);
  const [scopeSelections, setScopeSelections] = useState<ScopeSelection[]>([]);
  const [paceMode, setPaceMode] = useState<PaceMode>('clean-non-pit');
  const handleImportStateChange = useCallback((nextState: ImportRegisterState) => {
    setImportState(nextState);
  }, []);

  const laps = useMemo(
    () => importState.workbooks.flatMap((workbook) => workbook.laps),
    [importState.workbooks],
  );
  const scopeGroups = useMemo(() => groupLapsByDriver(laps), [laps]);
  const candidateStints = useMemo(() => detectStints(laps), [laps]);
  const eligibility = useMemo(
    () => deriveLapEligibility(laps, scopeSelections, candidateStints, paceMode),
    [candidateStints, laps, paceMode, scopeSelections],
  );
  const hasWorkbooks = importState.workbooks.length > 0;

  useEffect(() => {
    setScopeSelections((current) => reconcileScopeSelections(laps, current));
  }, [laps]);

  const handleScopeSelectionChange = useCallback(
    (scopeKey: string, update: Partial<Omit<ScopeSelection, 'scopeKey'>>) => {
      setScopeSelections((current) =>
        current.map((selection) =>
          selection.scopeKey === scopeKey ? { ...selection, ...update } : selection,
        ),
      );
    },
    [],
  );
  const report = useMemo(
    () =>
      hasWorkbooks
        ? buildAnalysisReport({
            workbooks: importState.workbooks,
            selections: scopeSelections,
            paceMode,
            generatedAt: new Date().toISOString(),
          })
        : null,
    [hasWorkbooks, importState.workbooks, paceMode, scopeSelections],
  );

  return (
    <main className="calibration-app">
      <header className="calibration-header">
        <a className="calibration-mark" href="#top" aria-label="Stint Analyzer home">
          <h2 className="calibration-mark__name" aria-label="Stint Analyzer">
            <strong>STINT</strong>
            <span>ANALYZER</span>
          </h2>
        </a>

        <div className="calibration-header__right">
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
        </div>
      </header>

      <section className="calibration-intro" id="top" aria-labelledby="page-title">
        <div className="calibration-intro__copy">
          <h1 id="page-title">
            Compare the run
            <span>before you coach it.</span>
          </h1>
          <p className="calibration-intro__lede">
            Add Garage 61 workbooks. <br /> Review the imported laps, then compare the runs that
            matter.
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
                    ? 'Confirm the import, then choose a review scope.'
                    : 'Choose one or more Garage 61 files to begin.'}
                </p>
              </div>
            </div>

            <ImportRegister onStateChange={handleImportStateChange} />
          </div>
        </div>
      </section>

      <ScopeReview
        groups={scopeGroups}
        selections={scopeSelections}
        eligibility={eligibility}
        paceMode={paceMode}
        onPaceModeChange={setPaceMode}
        onSelectionChange={handleScopeSelectionChange}
      />

      <section className="calibration-index" aria-labelledby="index-title">
        <div className="calibration-index__heading">
          <div>
            <h2 id="index-title">Analysis views.</h2>
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
            <Suspense
              fallback={
                <div className="calibration-panel">
                  <div className="calibration-panel__advisory">
                    <p>Loading analysis view.</p>
                  </div>
                </div>
              }
            >
              {report && activeTab === 'overview' ? (
                <Overview report={report} />
              ) : report && activeTab === 'sectors' ? (
                <Sectors report={report} />
              ) : report && activeTab === 'consistency' ? (
                <Consistency report={report} />
              ) : report && activeTab === 'drivers' ? (
                <Drivers report={report} />
              ) : (
                <div className="calibration-panel">
                  <div className="calibration-panel__advisory">
                    <h3>
                      {hasWorkbooks
                        ? `${tabs.find(([value]) => value === activeTab)?.[1]} will use the imported source data.`
                        : `${tabs.find(([value]) => value === activeTab)?.[1]} waits for source files.`}
                    </h3>
                    <p>
                      {hasWorkbooks
                        ? 'The selected scope is ready. Report calculations arrive in the next analysis steps.'
                        : 'Import a workbook to populate this view from the same canonical report.'}
                    </p>
                    <div className="calibration-panel__rule" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </Suspense>
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
