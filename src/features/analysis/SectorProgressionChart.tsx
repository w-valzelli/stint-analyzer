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
import {
  AnalysisChartTooltip,
  AnalysisSurface,
  formatSignedDurationUs,
} from './AnalysisPrimitives';

type SectorProgressionChartProps = {
  report: AnalysisReport;
  driver: string | null;
};

type SectorProgressionPoint = {
  lapKey: string;
  lapNumber: number;
  [sector: string]: number | string | null;
};

const ALL_SECTORS_OPTION = '__all_sectors__';
const dirtyKeyFor = (sector: string) => `${sector}__dirty`;
const lineColors = [
  'var(--calibration-cobalt)',
  'var(--calibration-vermilion)',
  'var(--calibration-moss)',
  'var(--calibration-ochre)',
];

function compareAuditRows(left: LapAuditRow, right: LapAuditRow): number {
  return (
    left.sourceFileName.localeCompare(right.sourceFileName, undefined, { sensitivity: 'base' }) ||
    left.sourceFileId.localeCompare(right.sourceFileId) ||
    left.rowNumber - right.rowNumber ||
    left.id.localeCompare(right.id)
  );
}

function selectionLabel(selectedSectors: readonly string[], sectors: readonly string[]): string {
  if (selectedSectors.length === sectors.length) {
    return 'All sectors';
  }
  if (selectedSectors.length === 1) {
    return selectedSectors[0] ?? 'No sectors selected';
  }
  return `${selectedSectors.length} sectors selected`;
}

export function pointsForReport(
  report: AnalysisReport,
  driver: string | null,
  sectors: readonly string[],
): SectorProgressionPoint[] {
  if (!driver) {
    return [];
  }

  const driverAnalysis = report.drivers.find((entry) => entry.driver === driver);
  const sectorMedians = new Map(
    (driverAnalysis?.sectors ?? []).map((sector) => [sector.sector, sector.medianUs]),
  );
  const rowsByLap = new Map<number, LapAuditRow[]>();

  report.lapAudit
    .filter(
      (row) =>
        row.driver === driver &&
        row.runtimeEligible &&
        row.lapNumber !== null &&
        row.lapTimeUs !== null,
    )
    .sort(compareAuditRows)
    .forEach((row) => {
      const lapNumber = row.lapNumber as number;
      const rows = rowsByLap.get(lapNumber) ?? [];
      rows.push(row);
      rowsByLap.set(lapNumber, rows);
    });

  const orderedRows = [...rowsByLap.entries()]
    .flatMap(([lapNumber, rows]) => rows.map((row, occurrence) => ({ lapNumber, occurrence, row })))
    .sort((left, right) => left.lapNumber - right.lapNumber || left.occurrence - right.occurrence);

  return orderedRows.map(({ lapNumber, occurrence, row }) => {
    const lapKey = `${lapNumber}:${occurrence}`;
    const isPitLap = row.pitIn || row.pitOut;
    const point: SectorProgressionPoint = { lapKey, lapNumber };

    for (const sector of sectors) {
      const sectorValue = row.sectorsUs[sector] ?? null;
      const sectorMedian = sectorMedians.get(sector) ?? null;
      const delta =
        isPitLap || sectorValue === null || sectorMedian === null
          ? null
          : sectorValue - sectorMedian;
      point[sector] = delta;
      point[dirtyKeyFor(sector)] = row.clean === false && !isPitLap ? delta : null;
    }

    return point;
  });
}

function yDomainFor(data: readonly SectorProgressionPoint[], sectors: readonly string[]) {
  const values = data.flatMap((point) =>
    sectors.flatMap((sector) => {
      const value = point[sector];
      return typeof value === 'number' ? [value] : [];
    }),
  );
  if (values.length === 0) {
    return ['auto', 'auto'] as const;
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max(100_000, (maximum - minimum) * 0.1);
  return [minimum - padding, maximum + padding] as const;
}

function progressionDot(sector: string, color: string) {
  return (props: DotItemDotProps) => {
    const point = props.payload as SectorProgressionPoint;
    const isDirty = point[dirtyKeyFor(sector)] !== null;
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

export function SectorProgressionChart({ report, driver }: SectorProgressionChartProps) {
  const sectorNames = useMemo(
    () => report.sectors.map((sector) => sector.sector),
    [report.sectors],
  );
  const sectorKey = sectorNames.join('\u0000');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(sectorNames);

  useEffect(() => {
    setSelectedSectors((current) => {
      const next = current.filter((sector) => sectorNames.includes(sector));
      return next.length > 0 ? next : [...sectorNames];
    });
  }, [sectorKey, sectorNames]);

  const data = useMemo(
    () => pointsForReport(report, driver, selectedSectors),
    [driver, report, selectedSectors],
  );
  const yDomain = useMemo(() => yDomainFor(data, selectedSectors), [data, selectedSectors]);

  return (
    <AnalysisSurface className="analysis-chart-surface">
      <div className="analysis-surface__header">
        <div>
          <h3>Sector progression</h3>
          <p>
            All selected completed laps are shown. <br /> Pit laps create gaps; ochre dots mark
            dirty laps.
            <br />
            Values show delta to the selected driver median.
          </p>
        </div>
        <div className="analysis-chart__control analysis-control">
          <span>Sectors</span>
          <CustomSelect
            label="Sectors"
            triggerLabel={selectionLabel(selectedSectors, sectorNames)}
            value={selectedSectors}
            multiple
            allOptionValue={ALL_SECTORS_OPTION}
            options={[
              { value: ALL_SECTORS_OPTION, label: 'All sectors' },
              ...sectorNames.map((sector) => ({ value: sector, label: sector })),
            ]}
            disabled={sectorNames.length === 0}
            onChange={(next) => {
              const values = Array.isArray(next) ? next : [next];
              setSelectedSectors((current) => (values.length > 0 ? values : current));
            }}
          />
        </div>
      </div>
      {data.length === 0 || selectedSectors.length === 0 ? (
        <p className="analysis-empty">No completed sector progression is available.</p>
      ) : (
        <div className="analysis-chart" role="img" aria-label="Sector progression chart">
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
                tickFormatter={(value: number) => formatSignedDurationUs(value)}
                width={66}
              />
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                content={(props) => (
                  <AnalysisChartTooltip
                    {...props}
                    formatLabel={(label) => `Lap ${String(label).split(':')[0] ?? label}`}
                    formatValue={(value, name) =>
                      `${String(name)} delta · ${formatSignedDurationUs(Number(value))}`
                    }
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
              {selectedSectors.map((sector, index) => {
                const color = lineColors[index % lineColors.length] ?? lineColors[0];
                return (
                  <Line
                    key={sector}
                    type="monotone"
                    dataKey={sector}
                    name={sector}
                    stroke={color}
                    strokeWidth={1.8}
                    dot={progressionDot(sector, color)}
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
