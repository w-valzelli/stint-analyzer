import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from './ui/button';
import {
  applyTheme,
  getSystemTheme,
  readThemePreference,
  writeThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme';

const nextPreference: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const preferenceLabels: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export function ThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const hasMounted = useRef(false);
  const hasUserInteracted = useRef(false);

  useEffect(() => {
    if (!hasUserInteracted.current) {
      setPreference(readThemePreference());
    }
    setSystemTheme(getSystemTheme());
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized || preference !== 'system') {
      return undefined;
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    if (typeof mediaQuery.addEventListener !== 'function') {
      return undefined;
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isInitialized, preference]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    applyTheme(preference, systemTheme);

    if (hasMounted.current) {
      writeThemePreference(preference);
    } else {
      hasMounted.current = true;
    }
  }, [isInitialized, preference, systemTheme]);

  const next = nextPreference[preference];
  const label = `Theme: ${preferenceLabels[preference]}. Switch to ${preferenceLabels[next]}`;

  return (
    <Button
      treatment="control"
      tone="neutral"
      size="sm"
      content="icon"
      aria-label={label}
      title={label}
      data-hydrated={isInitialized}
      onClick={() => {
        hasUserInteracted.current = true;
        setPreference(next);
      }}
    >
      {preference === 'system' && <Monitor aria-hidden="true" size={16} strokeWidth={1.8} />}
      {preference === 'light' && <Sun aria-hidden="true" size={16} strokeWidth={1.8} />}
      {preference === 'dark' && <Moon aria-hidden="true" size={16} strokeWidth={1.8} />}
    </Button>
  );
}
