import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AnalysisReport } from '../../domain/model/report';
import { AnalysisSurface, formatSignedDurationUs } from './AnalysisPrimitives';

type SectorProgressionChartProps = {
  report: AnalysisReport;
  driver: string | null;
};

type SectorProgressionPoint = {
  label: string;
  [sector: string]: string | number | null;
};

const lineColors = [
  'var(--calibration-cobalt)',
  'var(--calibration-vermilion)',
  'var(--calibration-moss)',
  'var(--calibration-ochre)',
];

export function SectorProgressionChart({ report, driver }: SectorProgressionChartProps) {
  const sectorNames = report.sectors.map((sector) => sector.sector);
  const data = report.stints
    .filter((stint) => !driver || stint.driver === driver)
    .flatMap((stint) =>
      stint.progression.map<SectorProgressionPoint>((lap) => ({
        label: `${stint.driver} · ${stint.index + 1}.${lap.lapIndex}`,
        ...Object.fromEntries(
          sectorNames.map((sector) => [sector, lap.sectorDeltaUs[sector] ?? null]),
        ),
      })),
    );

  return (
    <AnalysisSurface className="analysis-chart-surface">
      <div className="analysis-surface__header">
        <div>
          <h3>Sector progression</h3>
          <p>Sector deltas compare each selected lap with the driver median.</p>
        </div>
        <span className="analysis-surface__count">{data.length} laps</span>
      </div>
      {data.length === 0 || sectorNames.length === 0 ? (
        <p className="analysis-empty">No eligible sector progression is available.</p>
      ) : (
        <div className="analysis-chart" role="img" aria-label="Sector progression chart">
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
                tickFormatter={(value: number) => formatSignedDurationUs(value)}
                width={66}
              />
              <Tooltip
                labelFormatter={(label) => `Lap ${label}`}
                formatter={(value) => [formatSignedDurationUs(Number(value)), 'Delta']}
                contentStyle={{
                  border: '1px solid var(--calibration-rule-strong)',
                  borderRadius: '6px',
                  background: 'var(--calibration-sheet)',
                  color: 'var(--calibration-ink)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{
                  color: 'var(--calibration-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                }}
              />
              {sectorNames.map((sector, index) => (
                <Line
                  key={sector}
                  type="monotone"
                  dataKey={sector}
                  stroke={lineColors[index % lineColors.length]}
                  strokeWidth={1.8}
                  dot={{ r: 1.5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </AnalysisSurface>
  );
}
