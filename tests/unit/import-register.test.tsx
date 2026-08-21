import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParserWarning } from '../../src/domain/model/normalized';

const importWorkbookFilesMock = vi.hoisted(() => vi.fn());

vi.mock('../../src/domain/parsing/imports', () => ({
  importWorkbookFiles: importWorkbookFilesMock,
  trackMismatchMessage: (candidate: typeof parsedWorkbook, existing: (typeof parsedWorkbook)[]) => {
    const candidateTrack = candidate.source.trackName?.trim();
    const differentTrack = existing
      .map((workbook) => workbook.source.trackName?.trim())
      .find(
        (track) => track && candidateTrack && track.toLowerCase() !== candidateTrack.toLowerCase(),
      );
    return differentTrack
      ? `All imported lap data should use the same track. This file reports “${candidateTrack}”, but existing files report “${differentTrack}”.`
      : null;
  },
}));

import { ImportRegister } from '../../src/features/import/ImportRegister';

const parsedWorkbook = {
  source: {
    id: 'a'.repeat(64),
    name: 'session.xlsx',
    hash: 'a'.repeat(64),
    sheetName: 'Session - Practice',
    driverName: 'Alice',
    trackName: 'Synthetic Ring',
    carName: 'Prototype X',
    driverNames: ['Alice'],
    sectorNames: ['S1', 'S2'],
    timedLapCount: 2,
    fullTimedLapCount: 2,
    partialLapCount: 0,
    warningCount: 0,
  },
  laps: [],
  warnings: [] as ParserWarning[],
};

type ProgressEvent = {
  index: number;
  name: string;
  hash: string;
  status: 'parsing' | 'ready';
  parsed?: typeof parsedWorkbook;
};

type ProgressCallback = (event: ProgressEvent) => void;

function mockImport(warnings: ParserWarning[] = [], trackNames: string[] = ['Synthetic Ring']) {
  importWorkbookFilesMock.mockImplementation(
    async (
      files: File[],
      _existingHashes: ReadonlySet<string>,
      _concurrency: number,
      onProgress: ProgressCallback,
    ) => {
      files.forEach((file, index) => {
        const sourceId = String(index + 1).repeat(64);
        onProgress({
          index,
          name: file.name,
          hash: sourceId,
          status: 'ready',
          parsed: {
            ...parsedWorkbook,
            warnings,
            source: {
              ...parsedWorkbook.source,
              id: sourceId,
              hash: sourceId,
              name: file.name,
              trackName: trackNames[index] ?? trackNames[0] ?? null,
              warningCount: warnings.length,
            },
          },
        });
      });
      return { parsed: [parsedWorkbook], duplicates: [], failures: [] };
    },
  );
}

function createWorkbook(name: string) {
  return new File([name], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function dropFiles(files: File[]) {
  fireEvent.drop(screen.getByRole('group', { name: 'XLSX source files' }), {
    dataTransfer: {
      files,
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
  });
}

describe('ImportRegister', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    importWorkbookFilesMock.mockReset();
    mockImport();
  });

  it('accepts multiple XLSX files and keeps source metadata collapsed', async () => {
    const onStateChange = vi.fn();
    render(<ImportRegister onStateChange={onStateChange} />);
    const first = createWorkbook('first.xlsx');
    const second = createWorkbook('second.xlsx');

    dropFiles([first, second]);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Remove .*\.xlsx/ })).toHaveLength(2),
    );
    await waitFor(() => expect(onStateChange.mock.lastCall?.[0].workbooks).toHaveLength(2));
    expect(screen.getAllByText('File information')).toHaveLength(2);
    expect(screen.getAllByText('Driver name')).toHaveLength(2);
    expect(screen.getAllByText('Alice')).toHaveLength(2);
    expect(screen.getAllByText('Synthetic Ring')).toHaveLength(2);
    expect(screen.getAllByText('Prototype X')).toHaveLength(2);
    expect(
      screen.getAllByRole('article')[0].querySelector('.calibration-register__icon'),
    ).toBeNull();
    expect(screen.getAllByText('Synthetic Ring')[0]).not.toBeVisible();
    const firstInformation = screen.getAllByText('File information')[0];
    const informationDisclosure = firstInformation.closest('details');
    expect(informationDisclosure).not.toHaveAttribute('open');

    fireEvent.click(firstInformation);
    expect(informationDisclosure).toHaveAttribute('open');
    expect(screen.getAllByText('Synthetic Ring')[0]).toBeVisible();
    expect(screen.queryByText(/sectors · .*full timed laps/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove first.xlsx' })).toBeEnabled();
    expect(importWorkbookFilesMock).toHaveBeenCalledWith(
      [first, second],
      new Set(),
      4,
      expect.any(Function),
    );
  });

  it('rejects a file with a different track name and keeps the matching file', async () => {
    const onStateChange = vi.fn();
    mockImport([], ['Synthetic Ring', 'Other Ring']);
    render(<ImportRegister onStateChange={onStateChange} />);

    dropFiles([createWorkbook('matching.xlsx'), createWorkbook('different-track.xlsx')]);

    expect(
      await screen.findByText(/All imported lap data should use the same track/),
    ).toBeInTheDocument();
    expect(screen.getByText('Needs attention')).toBeInTheDocument();
    await waitFor(() => expect(onStateChange.mock.lastCall?.[0].workbooks).toHaveLength(1));
    expect(screen.getByText('matching.xlsx')).toBeInTheDocument();
    expect(screen.getByText('different-track.xlsx')).toBeInTheDocument();
  });

  it('removes one ready file and preserves the other file', async () => {
    const onStateChange = vi.fn();
    render(<ImportRegister onStateChange={onStateChange} />);
    dropFiles([createWorkbook('first.xlsx'), createWorkbook('second.xlsx')]);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Remove .*\.xlsx/ })).toHaveLength(2),
    );
    await waitFor(() => expect(onStateChange.mock.lastCall?.[0].workbooks).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'Remove first.xlsx' }));

    await waitFor(() => expect(screen.queryByText('first.xlsx')).not.toBeInTheDocument());
    expect(screen.getByText('second.xlsx')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove second.xlsx' })).toHaveClass(
      'calibration-button--content-icon',
    );
    expect(onStateChange.mock.lastCall?.[0].workbooks).toHaveLength(1);
  });

  it('keeps parser warnings collapsed until the user opens them', async () => {
    const warning: ParserWarning = {
      code: 'sector-sum-mismatch',
      severity: 'warning',
      message: 'Sector total differs from lap time.',
      sourceFileName: 'first.xlsx',
      rowNumber: 4,
    };
    mockImport([warning]);
    render(<ImportRegister onStateChange={vi.fn()} />);
    dropFiles([createWorkbook('first.xlsx')]);

    await waitFor(() => expect(screen.getByText('Warnings (1)')).toBeInTheDocument());
    const disclosure = screen.getByText('Warnings (1)').closest('details');
    expect(disclosure).not.toHaveAttribute('open');
    expect(screen.getByText(warning.message)).not.toBeVisible();

    fireEvent.click(screen.getByText('Warnings (1)'));
    expect(disclosure).toHaveAttribute('open');
    expect(screen.getByText(warning.message)).toBeVisible();
  });

  it('disables removal while a file is parsing', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    importWorkbookFilesMock.mockImplementation(
      async (
        files: File[],
        _hashes: ReadonlySet<string>,
        _concurrency: number,
        onProgress: ProgressCallback,
      ) => {
        onProgress({
          index: 0,
          name: files[0].name,
          hash: 'b'.repeat(64),
          status: 'parsing',
        });
        await pending;
        return { parsed: [], duplicates: [], failures: [] };
      },
    );
    render(<ImportRegister onStateChange={vi.fn()} />);
    const file = createWorkbook('parsing.xlsx');

    dropFiles([file]);

    await waitFor(() => expect(screen.getByText('Reading workbook')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Remove parsing.xlsx' })).toBeDisabled();
    release();
  });

  it('rejects a non-XLSX file with a visible recovery message', async () => {
    const onStateChange = vi.fn();
    render(<ImportRegister onStateChange={onStateChange} />);
    const textFile = new File(['not a workbook'], 'notes.txt', { type: 'text/plain' });

    dropFiles([textFile]);

    expect(await screen.findByText('Not accepted')).toBeInTheDocument();
    expect(screen.getByText(/file type must be/i)).toBeInTheDocument();
    const remove = screen.getByRole('button', { name: 'Remove notes.txt' });
    expect(remove).toBeEnabled();
    fireEvent.click(remove);
    expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
    expect(importWorkbookFilesMock).not.toHaveBeenCalled();
  });
});
