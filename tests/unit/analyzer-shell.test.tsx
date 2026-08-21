import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnalyzerShell } from '../../src/components/AnalyzerShell';

describe('AnalyzerShell', () => {
  it('shows the local analysis privacy message', () => {
    render(<AnalyzerShell />);

    expect(screen.getByRole('heading', { name: 'Garage 61 Stint Analyzer' })).toBeInTheDocument();
    expect(
      screen.getByText('No account. No upload. Analyze locally and export when done.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });
});
