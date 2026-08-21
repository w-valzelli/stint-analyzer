import type { AnalysisReport } from '../../domain/model/report';
import { AnalysisSurface } from '../analysis/AnalysisPrimitives';
import { ProgressionChart } from '../analysis/ProgressionChart';
import { Leaderboard } from '../leaderboard/Leaderboard';

type OverviewProps = {
  report: AnalysisReport;
};

export function Overview({ report }: OverviewProps) {
  return (
    <div className="analysis-view">
      <AnalysisSurface className="analysis-surface--table">
        <div className="analysis-surface__header">
          <div>
            <h3>Leaderboard</h3>
            <p>Runtime standings with the selected pace facts.</p>
          </div>
        </div>
        <Leaderboard report={report} />
      </AnalysisSurface>

      <ProgressionChart report={report} />
    </div>
  );
}
