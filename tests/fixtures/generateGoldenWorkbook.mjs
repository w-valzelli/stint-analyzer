import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import writeXlsxFile from 'write-excel-file/node';

const outputPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'golden-garage61-session.xlsx',
);

const headers = [
  'Run',
  'Lap',
  'Lap time',
  'Started at',
  'Driver',
  'Clean',
  'Pit in',
  'Pit out',
  'Track temp',
  'Track usage',
  'Air temperature',
  'Cloud cover',
  'Air density',
  'Air pressure',
  'Wind velocity',
  'Wind direction',
  'Relative humidity',
  'Fog level',
  'Precipitation',
  'Track Wetness',
  'Fuel level',
  'Fuel used',
  'Fuel added',
  'Sector 1',
  'Sector 2',
  'Sector 3',
  'Sector 4',
  'Sector 5',
  'Sector 6',
  'Sector 7',
];

const drivers = [
  {
    name: 'Astra Vale',
    bases: [12, 13, 14, 15, 16, 17, 18],
    uncleanLapIndex: 2,
    outlierLapIndex: null,
  },
  {
    name: 'Boreal Finch',
    bases: [12.1, 12.9, 14.2, 15.1, 15.9, 17.2, 18.1],
    uncleanLapIndex: 4,
    outlierLapIndex: null,
  },
  {
    name: 'Cygnus Reed',
    bases: [11.9, 13.1, 13.9, 15.2, 16.2, 16.8, 18.2],
    uncleanLapIndex: null,
    outlierLapIndex: 7,
  },
];

const lapAdjustments = [0.08, 0.04, 0.12, 0, 0.1, 0.06, 0.14, 0.02];

function excelDuration(seconds) {
  return seconds / 86_400;
}

function normalizeZipTimestamps(buffer) {
  const normalized = Buffer.from(buffer);
  const fixedDosTime = 0;
  const fixedDosDate = ((2026 - 1980) << 9) | (1 << 5) | 10;
  const headers = [
    { signature: Buffer.from([0x50, 0x4b, 0x03, 0x04]), timeOffset: 10 },
    { signature: Buffer.from([0x50, 0x4b, 0x01, 0x02]), timeOffset: 12 },
  ];

  for (const header of headers) {
    let offset = normalized.indexOf(header.signature);
    while (offset >= 0) {
      normalized.writeUInt16LE(fixedDosTime, offset + header.timeOffset);
      normalized.writeUInt16LE(fixedDosDate, offset + header.timeOffset + 2);
      offset = normalized.indexOf(header.signature, offset + header.signature.length);
    }
  }

  return normalized;
}

function startedAt(driverIndex, sequence) {
  const timestamp = Date.UTC(2026, 0, 10, 9 + driverIndex, sequence, 0);
  return new Date(timestamp).toISOString();
}

function sectorTimes(driver, lapIndex, extraSeconds = 0) {
  return driver.bases.map((base, sectorIndex) => {
    const rotatingVariation = ((lapIndex + sectorIndex) % 4) * 0.01;
    return base + lapAdjustments[lapIndex] + rotatingVariation + extraSeconds;
  });
}

function fixtureRow({
  run,
  lap,
  started,
  driver,
  clean,
  pitIn,
  pitOut,
  fuelLevel,
  fuelUsed,
  fuelAdded,
  sectors,
  lapTimeSeconds,
}) {
  return [
    run,
    lap,
    lapTimeSeconds === null ? null : excelDuration(lapTimeSeconds),
    started,
    driver,
    clean,
    pitIn,
    pitOut,
    27.5,
    82,
    19.5,
    20,
    1.21,
    1013.2,
    2.5,
    220,
    48,
    0,
    0,
    0,
    fuelLevel,
    fuelUsed,
    fuelAdded,
    ...sectors.map((seconds) => (seconds === null ? null : excelDuration(seconds))),
  ];
}

function timedRow(driver, driverIndex, run, lap, lapIndex, flags, sequence) {
  const outlierSeconds = driver.outlierLapIndex === lapIndex ? 3 : 0;
  const sectors = sectorTimes(driver, lapIndex, outlierSeconds);
  const lapTimeSeconds = sectors.reduce((sum, value) => sum + value, 0);
  const fuelStep = run === 1 ? lap : lap + 7;

  return fixtureRow({
    run,
    lap,
    started: startedAt(driverIndex, sequence),
    driver: driver.name,
    clean: flags.clean,
    pitIn: flags.pitIn,
    pitOut: flags.pitOut,
    fuelLevel: 62 - fuelStep * 2.35,
    fuelUsed: flags.pitIn || flags.pitOut ? 2.55 : 2.35,
    fuelAdded: run === 2 && flags.pitOut ? 28 : 0,
    sectors,
    lapTimeSeconds,
  });
}

function driverRows(driver, driverIndex) {
  const rows = [];
  let sequence = 0;

  rows.push(
    fixtureRow({
      run: 1,
      lap: 0,
      started: startedAt(driverIndex, sequence++),
      driver: driver.name,
      clean: true,
      pitIn: false,
      pitOut: false,
      fuelLevel: 62,
      fuelUsed: 0,
      fuelAdded: 0,
      sectors: [4, 5, null, null, null, null, null],
      lapTimeSeconds: 9,
    }),
  );

  let paceLapIndex = 0;
  for (const run of [1, 2]) {
    rows.push(
      timedRow(
        driver,
        driverIndex,
        run,
        1,
        paceLapIndex,
        { clean: true, pitIn: false, pitOut: true },
        sequence++,
      ),
    );

    for (const lap of [2, 3, 4, 5]) {
      rows.push(
        timedRow(
          driver,
          driverIndex,
          run,
          lap,
          paceLapIndex,
          {
            clean: driver.uncleanLapIndex !== paceLapIndex,
            pitIn: false,
            pitOut: false,
          },
          sequence++,
        ),
      );
      paceLapIndex += 1;
    }

    rows.push(
      timedRow(
        driver,
        driverIndex,
        run,
        6,
        Math.max(0, paceLapIndex - 1),
        { clean: true, pitIn: true, pitOut: false },
        sequence++,
      ),
    );
  }

  rows.push(
    fixtureRow({
      run: 2,
      lap: 7,
      started: startedAt(driverIndex, sequence),
      driver: driver.name,
      clean: true,
      pitIn: false,
      pitOut: false,
      fuelLevel: 28.4,
      fuelUsed: 0,
      fuelAdded: 0,
      sectors: [4.2, null, null, null, null, null, null],
      lapTimeSeconds: null,
    }),
  );

  return rows;
}

const overview = [
  ['Event info:'],
  ['Car'],
  [null, 'Synthetic Prototype F7'],
  ['Track'],
  [null, 'Fixture Park'],
  ['Driver'],
  [null, 'Synthetic three-driver field'],
];
const sessionRows = [
  headers,
  ...drivers.flatMap((driver, driverIndex) => driverRows(driver, driverIndex)),
];

const workbook = await writeXlsxFile([
  { sheet: 'Overview', data: overview },
  { sheet: 'Session - Practice', data: sessionRows, stickyRowsCount: 1 },
]).toBuffer();
await writeFile(outputPath, normalizeZipTimestamps(workbook));

console.log(
  `Wrote ${path.basename(outputPath)} with ${sessionRows.length - 1} synthetic lap rows.`,
);
