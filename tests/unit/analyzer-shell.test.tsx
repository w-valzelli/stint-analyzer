import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnalyzerShell } from '../../src/components/AnalyzerShell';

describe('AnalyzerShell', () => {
  it('shows the direct Stint Analyzer shell', () => {
    render(<AnalyzerShell />);

    expect(screen.getByRole('heading', { name: /Stint Analyzer/i })).toBeInTheDocument();
    expect(screen.getByText('All workbook data stays in your browser.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View source on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/w-valzelli/stint-analyzer',
    );
    expect(screen.getByRole('link', { name: 'View source on GitHub' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getByRole('button', { name: /Theme: System/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Source files' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Analysis views' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export report/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Reset source files/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Local / ephemeral')).not.toBeInTheDocument();
    expect(screen.queryByText('Clean is not a penalty')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });
});
