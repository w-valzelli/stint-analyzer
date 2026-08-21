import {
  columnFilteringFeature,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { AnalysisReport, LapAuditRow } from '../../domain/model/report';
import { formatDurationUs } from '../../lib/durations';
import { AnalysisSurface } from '../analysis/AnalysisPrimitives';

type AuditProps = {
  report: AnalysisReport;
};

const auditFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

function cleanLabel(value: boolean | null): string {
  return value === null ? '—' : value ? 'Yes' : 'No';
}

function auditReason(row: LapAuditRow): string {
  const reasons = [...new Set([...row.runtimeExclusionReasons, ...row.paceExclusionReasons])];
  return row.exclusionReason ?? (reasons.length === 0 ? '—' : reasons.join('; '));
}

function sortIcon(sorted: false | 'asc' | 'desc') {
  if (sorted === 'asc') {
    return <ArrowUp aria-hidden="true" size={13} />;
  }
  if (sorted === 'desc') {
    return <ArrowDown aria-hidden="true" size={13} />;
  }
  return <ArrowUpDown aria-hidden="true" size={13} />;
}

export function Audit({ report }: AuditProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const sectorNames = report.sectors.map((sector) => sector.sector);
  const columns = useMemo<ColumnDef<typeof auditFeatures, LapAuditRow>[]>(
    () => [
      { accessorKey: 'driver', header: 'Driver' },
      { accessorKey: 'sourceFileName', header: 'Source file' },
      { accessorKey: 'run', header: 'Run' },
      { accessorKey: 'lapNumber', header: 'Lap' },
      {
        accessorKey: 'lapTimeUs',
        header: 'Lap time',
        cell: (info) => formatDurationUs(info.getValue<number | null>()),
      },
      {
        accessorKey: 'clean',
        header: 'Clean',
        cell: (info) => cleanLabel(info.getValue<boolean | null>()),
      },
      {
        accessorKey: 'pitIn',
        header: 'Pit in',
        cell: (info) => (info.getValue<boolean>() ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'pitOut',
        header: 'Pit out',
        cell: (info) => (info.getValue<boolean>() ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'runtimeEligible',
        header: 'Runtime eligible',
        cell: (info) => (info.getValue<boolean>() ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'paceEligible',
        header: 'Pace eligible',
        cell: (info) => (info.getValue<boolean>() ? 'Yes' : 'No'),
      },
      {
        id: 'exclusionReason',
        accessorFn: auditReason,
        header: 'Exclusion reason',
      },
      {
        accessorKey: 'fuelLevel',
        header: 'Fuel',
        cell: (info) => {
          const value = info.getValue<number | null>();
          return value === null ? '—' : value.toFixed(2);
        },
      },
      ...sectorNames.map<ColumnDef<typeof auditFeatures, LapAuditRow>>((sector) => ({
        id: sector,
        accessorFn: (row) => row.sectorsUs[sector] ?? null,
        header: sector,
        cell: (info) => formatDurationUs(info.getValue<number | null>()),
      })),
    ],
    [sectorNames],
  );
  const table = useTable<typeof auditFeatures, LapAuditRow>({
    features: auditFeatures,
    data: report.lapAudit,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: 'includesString',
  });

  return (
    <div className="analysis-view">
      <AnalysisSurface className="analysis-surface--table audit-surface">
        <div className="analysis-surface__header analysis-surface__header--audit">
          <div>
            <h3>Lap audit</h3>
            <p>Sort columns or filter the normalized rows to trace each report decision.</p>
          </div>
          <label className="analysis-filter">
            <span>Filter rows</span>
            <input
              type="search"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Driver, file, status..."
            />
          </label>
        </div>
        <div className="analysis-audit-meta">
          Showing {table.getRowModel().rows.length} of {report.lapAudit.length} rows
        </div>
        <div className="analysis-table-wrap analysis-table-wrap--audit">
          <table aria-label="Normalized lap audit">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th scope="col" key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="analysis-table__sort"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sortIcon(header.column.getIsSorted())}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td className="analysis-table__empty" colSpan={columns.length}>
                    No audit rows match this filter.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <td key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AnalysisSurface>
    </div>
  );
}
