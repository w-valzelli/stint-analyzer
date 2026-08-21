import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';

import type { DriverAnalysis, ScorecardMetric } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import {
  AnalysisSurface,
  formatPercentage,
  formatSignedDurationUs,
  useChartTooltipPortal,
} from '../analysis/AnalysisPrimitives';

type ScorecardMetricKey = 'pace' | 'potential' | 'efficiency' | 'cleanliness' | 'consistency';

type ScorecardRow = {
  key: ScorecardMetricKey;
  label: string;
  chartLabel: string;
  metric: ScorecardMetric;
  valueLabel: string;
};

type RadarPoint = {
  label: string;
  radarScore: number;
  rankLabel: string;
  valueLabel: string;
};

type DriverScorecardProps = {
  driver: DriverAnalysis;
  driverCount: number;
};

function ordinal(value: number): string {
  const remainder100 = value % 100;
  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function rankLabel(metric: ScorecardMetric): string {
  if (metric.rank === null || metric.fieldSize === 0) {
    return '—';
  }
  return `${ordinal(metric.rank)} / ${metric.fieldSize}`;
}

function scorecardRows(driver: DriverAnalysis): ScorecardRow[] {
  return [
    {
      key: 'pace',
      label: 'Pace',
      chartLabel: 'PAC',
      metric: driver.scorecard.pace,
      valueLabel: formatDurationUs(driver.lapStats.medianUs),
    },
    {
      key: 'potential',
      label: 'Potential',
      chartLabel: 'POT',
      metric: driver.scorecard.potential,
      valueLabel: `Execution gap ${formatSignedDurationUs(driver.executionGapUs)}`,
    },
    {
      key: 'efficiency',
      label: 'Efficiency',
      chartLabel: 'EFF',
      metric: driver.scorecard.efficiency,
      valueLabel:
        driver.fuelUsedMeanLiters === null
          ? '—'
          : `${driver.fuelUsedMeanLiters.toFixed(2)} L / lap`,
    },
    {
      key: 'cleanliness',
      label: 'Cleanliness',
      chartLabel: 'CLN',
      metric: driver.scorecard.cleanliness,
      valueLabel: formatPercentage(driver.cleanPercentage),
    },
    {
      key: 'consistency',
      label: 'Consistency',
      chartLabel: 'CON',
      metric: driver.scorecard.consistency,
      valueLabel: `MAD ${formatDurationUs(driver.lapStats.madUs)}`,
    },
  ];
}

function ScorecardTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload as RadarPoint | undefined;
  if (!point) {
    return null;
  }

  return (
    <div className="analysis-scorecard__tooltip">
      <strong>{point.label}</strong>
      <span>{point.valueLabel}</span>
      <span>{point.rankLabel}</span>
    </div>
  );
}

export function DriverScorecard({ driver, driverCount }: DriverScorecardProps) {
  const tooltipPortal = useChartTooltipPortal();
  const rows = scorecardRows(driver);
  const chartRows = ['pace', 'potential', 'efficiency', 'cleanliness', 'consistency'].flatMap(
    (key) => rows.filter((row) => row.key === key),
  );
  const chartData = chartRows.flatMap((row) =>
    row.metric.radarScore === null
      ? []
      : [
          {
            label: row.chartLabel,
            radarScore: row.metric.radarScore,
            rankLabel: rankLabel(row.metric),
            valueLabel: row.valueLabel,
          },
        ],
  );
  const chartReady = chartData.length === rows.length;
  const radarMaximum = driverCount;

  return (
    <AnalysisSurface className="analysis-scorecard">
      <div className="analysis-surface__header">
        <div>
          <h3>Field profile</h3>
          <p>Five independent rankings compare {driver.driver} with the available drivers.</p>
        </div>
      </div>

      <div className="analysis-scorecard__body">
        <div
          className="analysis-scorecard__chart"
          role="img"
          aria-label={
            chartReady
              ? `${driver.driver} score profile radar chart`
              : `${driver.driver} score profile radar chart unavailable because one or more metrics lack comparable values`
          }
        >
          {chartReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} outerRadius="72%">
                <PolarGrid stroke="var(--calibration-rule-strong)" />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{
                    fill: 'var(--calibration-ink-soft)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, radarMaximum]}
                  axisLine={false}
                  tick={false}
                />
                <Radar
                  key={driver.driver}
                  name={driver.driver}
                  dataKey="radarScore"
                  stroke="var(--calibration-purple)"
                  fill="var(--calibration-purple)"
                  fillOpacity={0.2}
                  isAnimationActive="auto"
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                <Tooltip content={ScorecardTooltip} portal={tooltipPortal} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="analysis-empty">
              The profile graph needs comparable values for all five metrics.
            </p>
          )}
        </div>

        <dl
          className="analysis-scorecard__metrics"
          aria-label={`${driver.driver} scorecard metrics`}
        >
          {rows.map((row) => (
            <div className="analysis-scorecard__metric" key={row.key}>
              <dt>{row.label}</dt>
              <dd>
                <span className="analysis-scorecard__rank">{rankLabel(row.metric)}</span>
                <strong className="analysis-scorecard__value">{row.valueLabel}</strong>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </AnalysisSurface>
  );
}
