import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const importWorkbookFilesMock = vi.hoisted(() => vi.fn());

vi.mock('../../src/domain/parsing/imports', () => ({
  importWorkbookFiles: importWorkbookFilesMock,
}));

import { ImportRegister } from '../../src/features/import/ImportRegister';

const parsedWorkbook = {
  source: {
    id: 'a'.repeat(64),
    name: 'session.xlsx',
    hash: 'a'.repeat(64),
    sheetName: 'Session - Practice',
    driverNames: ['Alice'],
    sectorNames: ['S1', 'S2'],
    timedLapCount: 2,
    fullTimedLapCount: 2,
    partialLapCount: 0,
    warningCount: 0,
  },
  laps: [],
  warnings: [],
};

type ProgressEvent = {
  index: number;
  name: string;
  hash: string;
  status: 'ready';
  parsed: typeof parsedWorkbook;
};

type ProgressCallback = (event: ProgressEvent) => void;

function mockImport() {
  importWorkbookFilesMock.mockImplementation(
    async (
      files: File[],
      _existingHashes: ReadonlySet<string>,
      _concurrency: number,
      onProgress: ProgressCallback,
    ) => {
      files.forEach((file, index) => {
        onProgress({
          index,
          name: file.name,
          hash: 'a'.repeat(64),
          status: 'ready',
          parsed: { ...parsedWorkbook, source: { ...parsedWorkbook.source, name: file.name } },
        });
      });
      return { parsed: [parsedWorkbook], duplicates: [], failures: [] };
    },
  );
}

describe('ImportRegister', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    importWorkbookFilesMock.mockReset();
    mockImport();
  });

  it('accepts multiple XLSX files and shows registered source facts', async () => {
    const onStateChange = vi.fn();
    render(<ImportRegister onStateChange={onStateChange} />);

    const first = new File(['first'], 'first.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const second = new File(['second'], 'second.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    fireEvent.drop(screen.getByRole('group', { name: 'Local XLSX file register' }), {
      dataTransfer: {
        files: [first, second],
        items: [first, second].map((file) => ({
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        })),
        types: ['Files'],
      },
    });

    await waitFor(() => expect(screen.getAllByText('Registered')).toHaveLength(2));
    expect(screen.getAllByText('Alice · 2 sectors · 2 full timed laps')).toHaveLength(2);
    expect(importWorkbookFilesMock).toHaveBeenCalledWith(
      [first, second],
      new Set(),
      4,
      expect.any(Function),
    );
  });

  it('rejects a non-XLSX file with a recovery message', async () => {
    const onStateChange = vi.fn();
    render(<ImportRegister onStateChange={onStateChange} />);

    const textFile = new File(['not a workbook'], 'notes.txt', { type: 'text/plain' });
    fireEvent.drop(screen.getByRole('group', { name: 'Local XLSX file register' }), {
      dataTransfer: {
        files: [textFile],
        items: [{ kind: 'file', type: textFile.type, getAsFile: () => textFile }],
        types: ['Files'],
      },
    });

    expect(await screen.findByText('Not accepted')).toBeInTheDocument();
    expect(screen.getByText(/file type must be/i)).toBeInTheDocument();
    expect(importWorkbookFilesMock).not.toHaveBeenCalled();
  });
});
