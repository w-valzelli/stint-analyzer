import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotItemDotProps,
} from 'recharts';

import { AnalysisChartTooltip } from './AnalysisPrimitives';

export type LapSeriesPoint = {
  lapKey: string;
  lapNumber: number;
  [series: string]: number | string | null;
};

export type LapSeries = {
  key: string;
  color: string;
};

export type LapSeriesDomain = readonly [number, number] | readonly ['auto', 'auto'];

type LapSeriesChartProps = {
  data: LapSeriesPoint[];
  series: readonly LapSeries[];
  yDomain: LapSeriesDomain;
  yAxisWidth: number;
  strokeWidth: number;
  formatTick: (value: number) => string;
  formatTooltipValue: (value: number, name: string) => string;
  ariaLabel: string;
};

export const dirtyKeyFor = (series: string) => `${series}__dirty`;

function lapSeriesDot(series: string, color: string) {
  return (props: DotItemDotProps) => {
    const point = props.payload as LapSeriesPoint;
    const isDirty = point[dirtyKeyFor(series)] !== null;
    if (props.cx === undefined || props.cy === undefined) {
      return null;
    }
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={isDirty ? 3.5 : 2}
        fill={isDirty ? 'var(--calibration-ochre)' : color}
        stroke="var(--calibration-sheet)"
        strokeWidth={isDirty ? 1.5 : 0}
      />
    );
  };
}

export function LapSeriesChart({
  data,
  series,
  yDomain,
  yAxisWidth,
  strokeWidth,
  formatTick,
  formatTooltipValue,
  ariaLabel,
}: LapSeriesChartProps) {
  return (
    <div className="analysis-chart" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 18, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="var(--calibration-rule)" vertical={false} />
          <XAxis
            dataKey="lapKey"
            tick={{
              fill: 'var(--calibration-ink-soft)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}
            tickLine={false}
            axisLine={{ stroke: 'var(--calibration-rule-strong)' }}
            minTickGap={24}
            tickFormatter={(value: string) => value.split(':')[0] ?? value}
          />
          <YAxis
            domain={yDomain}
            tick={{
              fill: 'var(--calibration-ink-soft)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatTick(value)}
            width={yAxisWidth}
          />
          <Tooltip
            allowEscapeViewBox={{ x: true, y: true }}
            content={(props) => (
              <AnalysisChartTooltip
                {...props}
                formatLabel={(label) => `Lap ${String(label).split(':')[0] ?? label}`}
                formatValue={(value, name) => formatTooltipValue(Number(value), String(name))}
              />
            )}
          />
          <Legend
            wrapperStyle={{
              color: 'var(--calibration-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              textTransform: 'uppercase',
            }}
          />
          {series.map(({ key, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stroke={color}
              strokeWidth={strokeWidth}
              dot={lapSeriesDot(key, color)}
              activeDot={{ r: 4, fill: 'var(--calibration-vermilion)' }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
