export const THEME_STORAGE_KEY = 'stint-analyzer-theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference;
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function writeThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function applyTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme = getSystemTheme(),
): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference, systemTheme);

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }

  return resolvedTheme;
}
