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
import { useEffect, useMemo, useState } from 'react';

import { CustomSelect } from '../../components/ui/select';
import type { AnalysisReport, LapAuditRow } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import { AnalysisSurface } from './AnalysisPrimitives';

type ProgressionChartProps = {
  report: AnalysisReport;
  driver?: string | null;
};

type ProgressionPoint = {
  lapKey: string;
  lapNumber: number;
  [driver: string]: number | string | null;
};

const ALL_DRIVERS_OPTION = '__all_drivers__';
const dirtyKeyFor = (driver: string) => `${driver}__dirty`;
const lineColors = [
  'var(--calibration-cobalt)',
  'var(--calibration-vermilion)',
  'var(--calibration-moss)',
  'var(--calibration-ochre)',
  'var(--calibration-purple)',
];

function compareAuditRows(left: LapAuditRow, right: LapAuditRow): number {
  return (
    left.sourceFileName.localeCompare(right.sourceFileName, undefined, { sensitivity: 'base' }) ||
    left.sourceFileId.localeCompare(right.sourceFileId) ||
    left.rowNumber - right.rowNumber ||
    left.id.localeCompare(right.id)
  );
}

function selectionLabel(selectedDrivers: readonly string[], drivers: readonly string[]): string {
  if (selectedDrivers.length === drivers.length) {
    return 'All drivers';
  }
  if (selectedDrivers.length === 1) {
    return selectedDrivers[0] ?? 'No drivers selected';
  }
  return `${selectedDrivers.length} drivers selected`;
}

export function pointsForReport(
  report: AnalysisReport,
  drivers: readonly string[],
): ProgressionPoint[] {
  const selectedDrivers = new Set(drivers);
  const rowsByDriver = new Map<string, Map<number, LapAuditRow[]>>();

  report.lapAudit
    .filter(
      (row) =>
        selectedDrivers.has(row.driver) &&
        row.runtimeEligible &&
        row.lapNumber !== null &&
        row.lapTimeUs !== null,
    )
    .sort(compareAuditRows)
    .forEach((row) => {
      const rowsByLap = rowsByDriver.get(row.driver) ?? new Map<number, LapAuditRow[]>();
      const lapNumber = row.lapNumber as number;
      const rows = rowsByLap.get(lapNumber) ?? [];
      rows.push(row);
      rowsByLap.set(lapNumber, rows);
      rowsByDriver.set(row.driver, rowsByLap);
    });

  const lapPoints = new Map<string, { lapNumber: number; occurrence: number }>();
  for (const rowsByLap of rowsByDriver.values()) {
    for (const [lapNumber, rows] of rowsByLap) {
      rows.forEach((_row, occurrence) => {
        const lapKey = `${lapNumber}:${occurrence}`;
        lapPoints.set(lapKey, { lapNumber, occurrence });
      });
    }
  }

  const orderedLapPoints = [...lapPoints.entries()].sort(
    ([, left], [, right]) => left.lapNumber - right.lapNumber || left.occurrence - right.occurrence,
  );

  return orderedLapPoints.map(([lapKey, { lapNumber, occurrence }]) => {
    const point: ProgressionPoint = { lapKey, lapNumber };
    for (const driver of drivers) {
      const row = rowsByDriver.get(driver)?.get(lapNumber)?.[occurrence];
      const isPitLap = row?.pitIn === true || row?.pitOut === true;
      point[driver] = isPitLap ? null : (row?.lapTimeUs ?? null);
      point[dirtyKeyFor(driver)] = row?.clean === false && !isPitLap ? row.lapTimeUs : null;
    }
    return point;
  });
}

function yDomainFor(data: readonly ProgressionPoint[], drivers: readonly string[]) {
  const values = data.flatMap((point) =>
    drivers.flatMap((driver) => {
      const value = point[driver];
      return typeof value === 'number' ? [value] : [];
    }),
  );
  if (values.length === 0) {
    return ['auto', 'auto'] as const;
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max(300_000, (maximum - minimum) * 0.1);
  return [Math.max(0, minimum - padding), maximum + padding] as const;
}

function progressionDot(driver: string, color: string) {
  return (props: DotItemDotProps) => {
    const point = props.payload as ProgressionPoint;
    const isDirty = point[dirtyKeyFor(driver)] !== null;
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

export function ProgressionChart({ report, driver }: ProgressionChartProps) {
  const driverNames = useMemo(
    () => report.leaderboard.map((row) => row.driver),
    [report.leaderboard],
  );
  const driverKey = driverNames.join('\u0000');
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(driverNames);

  useEffect(() => {
    setSelectedDrivers((current) => {
      const next = current.filter((entry) => driverNames.includes(entry));
      return next.length > 0 ? next : [...driverNames];
    });
  }, [driverKey, driverNames]);

  const chartDrivers = driver ? [driver] : selectedDrivers;
  const data = useMemo(() => pointsForReport(report, chartDrivers), [chartDrivers, report]);
  const yDomain = useMemo(() => yDomainFor(data, chartDrivers), [chartDrivers, data]);

  return (
    <AnalysisSurface className="analysis-chart-surface">
      <div className="analysis-surface__header">
        <div>
          <h3>{driver ? `${driver} pace progression` : 'Pace progression'}</h3>
          <p>
            All selected completed laps are shown. Pit laps create gaps; ochre dots mark dirty laps.
          </p>
        </div>
        {!driver && (
          <div className="analysis-chart__control analysis-control">
            <span>Drivers</span>
            <CustomSelect
              label="Drivers"
              triggerLabel={selectionLabel(selectedDrivers, driverNames)}
              value={selectedDrivers}
              multiple
              allOptionValue={ALL_DRIVERS_OPTION}
              options={[
                { value: ALL_DRIVERS_OPTION, label: 'All drivers' },
                ...driverNames.map((entry) => ({ value: entry, label: entry })),
              ]}
              disabled={driverNames.length === 0}
              onChange={(next) => {
                const values = Array.isArray(next) ? next : [next];
                setSelectedDrivers((current) => (values.length > 0 ? values : current));
              }}
            />
          </div>
        )}
      </div>
      {data.length === 0 ? (
        <p className="analysis-empty">No completed laps are available for this chart.</p>
      ) : (
        <div className="analysis-chart" role="img" aria-label="Lap pace progression chart">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 18, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="var(--calibration-rule)" vertical={false} />
              <XAxis
                dataKey="lapKey"
                tick={{ fill: 'var(--calibration-muted)', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--calibration-rule-strong)' }}
                minTickGap={24}
                tickFormatter={(value: string) => value.split(':')[0] ?? value}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: 'var(--calibration-muted)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatDurationUs(value)}
                width={58}
              />
              <Tooltip
                labelFormatter={(label) => `Lap ${String(label).split(':')[0] ?? label}`}
                formatter={(value, name) => [formatDurationUs(Number(value)), name]}
                contentStyle={{
                  border: '1px solid var(--calibration-rule-strong)',
                  borderRadius: '6px',
                  background: 'var(--calibration-sheet)',
                  color: 'var(--calibration-ink)',
                  fontFamily: 'var(--font-sans)',
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
              {chartDrivers.map((entry) => {
                const color =
                  lineColors[driverNames.indexOf(entry) % lineColors.length] ?? lineColors[0];
                return (
                  <Line
                    key={entry}
                    type="monotone"
                    dataKey={entry}
                    name={entry}
                    stroke={color}
                    strokeWidth={2}
                    dot={progressionDot(entry, color)}
                    activeDot={{ r: 4, fill: 'var(--calibration-vermilion)' }}
                    connectNulls={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </AnalysisSurface>
  );
}
