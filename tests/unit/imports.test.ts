import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HashableFile } from '../../src/domain/parsing/hash';
import {
  importWorkbookFiles,
  trackMismatchMessage,
  type ImportProgressEvent,
} from '../../src/domain/parsing/imports';
import { parseWorkbookFile } from '../../src/domain/parsing/workbook';

vi.mock('../../src/domain/parsing/workbook', { spy: true });

function workbook(trackName: string | null, name = 'session.xlsx') {
  return {
    source: {
      id: 'a'.repeat(64),
      name,
      hash: 'a'.repeat(64),
      sheetName: 'Session - Practice',
      driverName: 'Alice',
      trackName,
      carName: 'Prototype X',
      driverNames: ['Alice'],
      sectorNames: ['S1'],
      timedLapCount: 0,
      fullTimedLapCount: 0,
      partialLapCount: 0,
      warningCount: 0,
    },
    laps: [],
    warnings: [],
  };
}

// Hashing reads the bytes immediately; parsing waits until the test releases it.
function deferredParseFile(name: string) {
  let release!: () => void;
  const parseRead = new Promise<ArrayBuffer>((resolve) => {
    release = () => resolve(new TextEncoder().encode(name).buffer);
  });
  let reads = 0;
  const file: HashableFile = {
    name,
    arrayBuffer: () => {
      reads += 1;
      return reads === 1 ? Promise.resolve(new TextEncoder().encode(name).buffer) : parseRead;
    },
  };

  return { file, release };
}

describe('importWorkbookFiles', () => {
  afterEach(() => vi.mocked(parseWorkbookFile).mockReset());

  it('reports a track mismatch without rejecting a workbook with no track metadata', () => {
    const existing = workbook('Synthetic Ring');
    const candidate = workbook('Other Ring');

    expect(trackMismatchMessage(candidate, [existing])).toContain(
      'All imported lap data should use the same track.',
    );
    expect(trackMismatchMessage(workbook(null), [existing])).toBeNull();
    expect(trackMismatchMessage(workbook('synthetic ring'), [existing])).toBeNull();
  });

  it('reports invalid workbook content without throwing from the batch', async () => {
    const file = new File(['not an xlsx'], 'broken.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const results = await importWorkbookFiles([file]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ index: 0, name: 'broken.xlsx', status: 'error' });
    expect(results[0].status === 'error' && results[0].message).toContain('could not be read');
  });

  it('keeps results attached to their files and in input order when parsing completes out of order', async () => {
    const tracks: Record<string, string> = {
      'first.xlsx': 'Synthetic Ring',
      'second.xlsx': 'Other Ring',
    };
    vi.mocked(parseWorkbookFile).mockImplementation(async (_bytes, source) => ({
      ...workbook(tracks[source.name], source.name),
      source: { ...workbook(tracks[source.name], source.name).source, ...source },
    }));
    const first = deferredParseFile('first.xlsx');
    const second = deferredParseFile('second.xlsx');
    const events: ImportProgressEvent[] = [];

    const pending = importWorkbookFiles([first.file, second.file], [], 4, (event) =>
      events.push(event),
    );
    await vi.waitFor(() =>
      expect(events.filter((event) => event.status === 'parsing')).toHaveLength(2),
    );
    second.release();
    await vi.waitFor(() => expect(parseWorkbookFile).toHaveBeenCalledTimes(1));
    first.release();
    const results = await pending;

    expect(vi.mocked(parseWorkbookFile).mock.calls.map(([, source]) => source.name)).toEqual([
      'second.xlsx',
      'first.xlsx',
    ]);
    expect(results.map((result) => [result.index, result.file, result.status])).toEqual([
      [0, first.file, 'ready'],
      [1, second.file, 'error'],
    ]);
    expect(results[0].status === 'ready' && results[0].parsed.source.name).toBe('first.xlsx');
    expect(results[1].status === 'error' && results[1].parsed?.source.name).toBe('second.xlsx');
    expect(results[1].status === 'error' && results[1].message).toContain(
      'This file reports “Other Ring”, but existing files report “Synthetic Ring”.',
    );
    expect(
      events
        .filter((event) => event.status !== 'parsing')
        .map((event) => [event.index, event.status]),
    ).toEqual([
      [0, 'ready'],
      [1, 'error'],
    ]);
  });
});
