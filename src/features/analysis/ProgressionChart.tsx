import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AnalysisReport } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import { AnalysisSurface } from './AnalysisPrimitives';

type ProgressionChartProps = {
  report: AnalysisReport;
  driver?: string | null;
};

type ProgressionPoint = {
  label: string;
  lapTimeUs: number;
};

function pointsForReport(report: AnalysisReport, driver: string | null | undefined) {
  return report.stints
    .filter((stint) => !driver || stint.driver === driver)
    .flatMap((stint) =>
      stint.progression.map<ProgressionPoint>((lap) => ({
        label: `${stint.driver} · ${lap.lapIndex}`,
        lapTimeUs: lap.lapTimeUs,
      })),
    );
}

export function ProgressionChart({ report, driver }: ProgressionChartProps) {
  const data = pointsForReport(report, driver);

  return (
    <AnalysisSurface className="analysis-chart-surface">
      <div className="analysis-surface__header">
        <div>
          <h3>{driver ? `${driver} pace progression` : 'Pace progression'}</h3>
          <p>Eligible pace laps only. Pit and partial laps do not enter this chart.</p>
        </div>
        <span className="analysis-surface__count">{data.length} laps</span>
      </div>
      {data.length === 0 ? (
        <p className="analysis-empty">No eligible pace laps are available for this chart.</p>
      ) : (
        <div className="analysis-chart" role="img" aria-label="Lap pace progression chart">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 10, right: 18, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="var(--calibration-rule)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--calibration-muted)', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--calibration-rule-strong)' }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: 'var(--calibration-muted)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatDurationUs(value)}
                width={58}
              />
              <Tooltip
                labelFormatter={(label) => `Lap ${label}`}
                formatter={(value) => [formatDurationUs(Number(value)), 'Lap time']}
                contentStyle={{
                  border: '1px solid var(--calibration-rule-strong)',
                  borderRadius: '6px',
                  background: 'var(--calibration-sheet)',
                  color: 'var(--calibration-ink)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="lapTimeUs"
                stroke="var(--calibration-cobalt)"
                strokeWidth={2}
                dot={{ r: 2, fill: 'var(--calibration-cobalt)' }}
                activeDot={{ r: 4, fill: 'var(--calibration-vermilion)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </AnalysisSurface>
  );
}
