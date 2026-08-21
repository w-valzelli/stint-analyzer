import { FileSpreadsheet, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const tabs = [
  ['overview', 'Overview'],
  ['leaderboard', 'Leaderboard'],
  ['sectors', 'Sectors'],
  ['consistency', 'Consistency'],
  ['drivers', 'Drivers'],
  ['audit', 'Audit'],
] as const;

export function AnalyzerShell() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Garage 61 analysis
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Garage 61 Stint Analyzer
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <LockKeyhole aria-hidden="true" size={15} />
            Local analysis — files stay in your browser.
          </p>
        </div>
        <Button variant="outline" disabled>
          Export
        </Button>
      </header>

      <section className="grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            <ShieldCheck aria-hidden="true" size={14} />
            Private by design
          </div>
          <h2 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Compare stints without sending your data anywhere.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Review runtime, pace, sectors, consistency, penalties, and lap evidence from Garage 61
            exports. The complete analysis stays in memory until you export it.
          </p>
          <p className="mt-5 font-mono text-sm text-cyan-200">
            No account. No upload. Analyze locally and export when done.
          </p>
        </div>

        <Card className="border-cyan-400/20 bg-cyan-400/[0.04]">
          <CardHeader>
            <CardTitle>Start with local files</CardTitle>
            <CardDescription>
              The import workflow will accept multiple Garage 61 XLSX exports in the next milestone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              aria-label="XLSX import area"
              className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/60 px-6 text-center"
            >
              <FileSpreadsheet aria-hidden="true" className="mb-3 text-cyan-300" size={32} />
              <p className="font-medium text-slate-200">Drop session exports here</p>
              <p className="mt-2 text-sm text-slate-500">XLSX files stay on this device.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex-1 border-t border-slate-800 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList aria-label="Analysis sections">
            {tabs.map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Import a workbook to populate the canonical analysis report and its views.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Runtime</p>
                    <p className="mt-2 text-lg font-medium text-slate-200">Waiting for files</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Pace mode</p>
                    <p className="mt-2 text-lg font-medium text-slate-200">Clean, non-pit</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Storage</p>
                    <p className="mt-2 text-lg font-medium text-slate-200">Ephemeral</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {tabs.slice(1).map(([value, label]) => (
            <TabsContent key={value} value={value}>
              <Card>
                <CardHeader>
                  <CardTitle>{label}</CardTitle>
                  <CardDescription>
                    This view becomes available after local workbook import and scope review.
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <footer className="mt-10 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500">
        The app has no account system, backend, remote storage, or hosted AI connection.
      </footer>
    </main>
  );
}

export default AnalyzerShell;
