import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportMenu } from '../../src/features/export/ExportMenu';
import { downloadReportFormats, exportFilename } from '../../src/features/export/downloads';
import { makeAnalysisReport } from '../fixtures/analysisReport';

vi.mock('../../src/features/export/downloads', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/features/export/downloads')>();
  return { ...original, downloadReportFormats: vi.fn().mockResolvedValue(undefined) };
});

describe('ExportMenu', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('stays unavailable without a report', () => {
    render(<ExportMenu report={null} />);

    expect(screen.getByRole('button', { name: 'Export report' })).toBeDisabled();
  });

  it('selects multiple formats and confirms one batch export', async () => {
    const user = userEvent.setup();
    const report = makeAnalysisReport();
    render(<ExportMenu report={report} />);

    await user.click(screen.getByRole('button', { name: 'Export report' }));
    expect(screen.getByLabelText('Export format selection')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Download selected' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /Excel workbook/ }));
    await user.click(screen.getByRole('checkbox', { name: /Markdown full/ }));
    await user.click(screen.getByRole('button', { name: 'Download selected' }));

    expect(downloadReportFormats).toHaveBeenCalledWith(report, ['xlsx', 'markdown-full']);
    expect(screen.queryByLabelText('Export format selection')).not.toBeInTheDocument();
  });

  it('uses collision-free deterministic filenames for both Markdown modes', () => {
    const date = new Date(2026, 7, 21, 12, 34);

    expect(exportFilename('xlsx', date)).toBe('garage61-analysis-2026-08-21-1234.xlsx');
    expect(exportFilename('json', date)).toBe('garage61-analysis-2026-08-21-1234.json');
    expect(exportFilename('markdown-summary', date)).toBe(
      'garage61-analysis-2026-08-21-1234-summary.md',
    );
    expect(exportFilename('markdown-full', date)).toBe('garage61-analysis-2026-08-21-1234-full.md');
  });
});
