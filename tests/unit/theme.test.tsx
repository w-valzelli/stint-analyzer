import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeControl } from '../../src/components/ThemeControl';
import {
  applyTheme,
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
} from '../../src/lib/theme';

const storage = new Map<string, string>();
const localStorageMock = {
  clear: () => storage.clear(),
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};

function mockSystemTheme(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const matchMedia = vi.fn((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  }));

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: matchMedia,
  });

  return {
    set(matchesNext: boolean) {
      matches = matchesNext;
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
  };
}

describe('theme', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('parses preferences and resolves system mode', () => {
    expect(parseThemePreference('dark')).toBe('dark');
    expect(parseThemePreference('unknown')).toBe('system');
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('light', 'dark')).toBe('light');
  });

  it('applies the resolved theme to the document', () => {
    expect(applyTheme('dark')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('starts in system mode and cycles through light and dark', async () => {
    render(<ThemeControl />);
    const control = await screen.findByRole('button', { name: /Theme: System/ });

    fireEvent.click(control);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Theme: Light/ })).toBeInTheDocument(),
    );
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: /Theme: Light/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Theme: Dark/ })).toBeInTheDocument(),
    );
    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: /Theme: Dark/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Theme: System/ })).toBeInTheDocument(),
    );
  });

  it('restores an explicit preference after mount', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<ThemeControl />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Theme: Dark/ })).toBeInTheDocument(),
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('follows system changes only in System mode', async () => {
    const system = mockSystemTheme(false);
    render(<ThemeControl />);
    await screen.findByRole('button', { name: /Theme: System/ });

    system.set(true);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));

    fireEvent.click(screen.getByRole('button', { name: /Theme: System/ }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    system.set(true);
    expect(document.documentElement.dataset.theme).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: /Theme: Light/ }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    system.set(false);
    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: /Theme: Dark/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Theme: System/ })).toBeInTheDocument(),
    );
    system.set(false);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
  });
});
