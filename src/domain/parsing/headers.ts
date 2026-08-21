export type HeaderKey =
  | 'driver'
  | 'run'
  | 'lap'
  | 'lapTime'
  | 'startedAt'
  | 'clean'
  | 'pitIn'
  | 'pitOut'
  | 'fuelLevel'
  | 'fuelUsed'
  | 'fuelAdded'
  | 'trackTemp'
  | 'airTemp';

export type SectorColumn = {
  name: string;
  index: number;
  number: number;
};

export type HeaderDetection = {
  rowIndex: number;
  columns: Partial<Record<HeaderKey, number>>;
  sectorColumns: SectorColumn[];
};

const headerAliases: Record<string, HeaderKey> = {
  driver: 'driver',
  run: 'run',
  lap: 'lap',
  'lap time': 'lapTime',
  'started at': 'startedAt',
  clean: 'clean',
  'pit in': 'pitIn',
  'pit out': 'pitOut',
  'fuel level': 'fuelLevel',
  'fuel used': 'fuelUsed',
  'fuel added': 'fuelAdded',
  'track temp': 'trackTemp',
  'air temperature': 'airTemp',
  'air temp': 'airTemp',
};

export function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function detectHeaderRow(rows: readonly (readonly unknown[])[]): HeaderDetection | null {
  for (const [rowIndex, row] of rows.entries()) {
    const columns: Partial<Record<HeaderKey, number>> = {};
    const sectorColumns: SectorColumn[] = [];

    row.forEach((cell, index) => {
      const normalized = normalizeHeader(cell);
      const alias = headerAliases[normalized];
      if (alias && columns[alias] === undefined) {
        columns[alias] = index;
      }

      const sectorMatch = normalized.match(/^sector\s+(\d+)$/);
      if (sectorMatch) {
        sectorColumns.push({
          name: `S${Number(sectorMatch[1])}`,
          index,
          number: Number(sectorMatch[1]),
        });
      }
    });

    sectorColumns.sort((left, right) => left.number - right.number);

    if (columns.driver !== undefined && columns.lapTime !== undefined && sectorColumns.length > 0) {
      return { rowIndex, columns, sectorColumns };
    }
  }

  return null;
}

export function findHeaderIndex(detection: HeaderDetection, key: HeaderKey): number | undefined {
  return detection.columns[key];
}
