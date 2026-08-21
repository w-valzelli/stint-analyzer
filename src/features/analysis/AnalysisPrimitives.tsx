import { useEffect, useState, type ReactNode } from 'react';
import type { TooltipContentProps } from 'recharts';

import type { AnalysisReport, MetricStats } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import { useAnalysisViewStore } from '../../state/analysis-view';
import { CustomSelect, type CustomSelectOption } from '../../components/ui/select';

type MetricItem = {
  label: string;
  value: string;
  detail?: string;
};

type MetricStripProps = {
  items: readonly MetricItem[];
};

export function MetricStrip({ items }: MetricStripProps) {
  return (
    <dl className="analysis-metric-strip">
      {items.map((item) => (
        <div className="analysis-metric-strip__item" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.detail ? <small>{item.detail}</small> : null}
        </div>
      ))}
    </dl>
  );
}

type AnalysisSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function AnalysisSurface({ children, className = '' }: AnalysisSurfaceProps) {
  return <section className={`analysis-surface ${className}`}>{children}</section>;
}

export function useChartTooltipPortal(): HTMLElement | null {
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortal(document.body);
  }, []);

  return portal;
}

type AnalysisChartTooltipProps = TooltipContentProps & {
  formatLabel: (label: unknown) => string;
  formatValue: (value: unknown, name: unknown) => string;
};

export function AnalysisChartTooltip({
  active,
  label,
  payload,
  formatLabel,
  formatValue,
}: AnalysisChartTooltipProps) {
  const entries =
    payload?.filter((entry) => entry.value !== null && entry.value !== undefined) ?? [];
  if (!active || entries.length === 0) {
    return null;
  }

  return (
    <div className="analysis-chart-tooltip">
      <strong>{formatLabel(label)}</strong>
      {entries.map((entry) => (
        <span key={String(entry.dataKey ?? entry.name)}>
          {formatValue(entry.value, entry.name)}
        </span>
      ))}
    </div>
  );
}

type SelectControlProps = {
  label: string;
  value: string;
  options: readonly CustomSelectOption[];
  onChange: (value: string) => void;
};

export function SelectControl({ label, value, options, onChange }: SelectControlProps) {
  return (
    <div className="analysis-control">
      <span>{label}</span>
      <CustomSelect
        label={label}
        value={value}
        options={options}
        onChange={(next) => onChange(next as string)}
      />
    </div>
  );
}

export function formatPercentage(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

export function formatSignedDurationUs(valueUs: number | null): string {
  if (valueUs === null) {
    return '—';
  }
  if (valueUs === 0) {
    return formatDurationUs(0);
  }
  return `${valueUs > 0 ? '+' : '−'}${formatDurationUs(Math.abs(valueUs))}`;
}

export function metricValue(stats: MetricStats, metric: 'sd' | 'mad' | 'iqr' | 'range') {
  return {
    sd: stats.sdUs,
    mad: stats.madUs,
    iqr: stats.iqrUs,
    range: stats.rangeUs,
  }[metric];
}

export function useActiveDriver(report: AnalysisReport): string | null {
  const selectedDriver = useAnalysisViewStore((state) => state.selectedDriver);
  const setSelectedDriver = useAnalysisViewStore((state) => state.setSelectedDriver);
  const drivers = report.drivers
    .filter((driver) => driver.runtimeLapCount > 0)
    .map((driver) => driver.driver);
  const driverKey = drivers.join('\u0000');

  useEffect(() => {
    if (drivers.length === 0) {
      if (selectedDriver !== null) {
        setSelectedDriver(null);
      }
      return;
    }
    if (!selectedDriver || !drivers.includes(selectedDriver)) {
      setSelectedDriver(drivers[0]);
    }
  }, [driverKey, drivers, selectedDriver, setSelectedDriver]);

  return selectedDriver && drivers.includes(selectedDriver) ? selectedDriver : (drivers[0] ?? null);
}

export function DriverControl({ report }: { report: AnalysisReport }) {
  const selectedDriver = useActiveDriver(report);
  const setSelectedDriver = useAnalysisViewStore((state) => state.setSelectedDriver);
  const drivers = report.drivers
    .filter((driver) => driver.runtimeLapCount > 0)
    .map((driver) => driver.driver);

  return (
    <div className="analysis-control">
      <span>Driver</span>
      <CustomSelect
        label="Driver"
        value={selectedDriver ?? ''}
        options={drivers.map((driver) => ({ value: driver, label: driver }))}
        onChange={(next) => setSelectedDriver(next as string)}
        disabled={drivers.length === 0}
      />
    </div>
  );
}
