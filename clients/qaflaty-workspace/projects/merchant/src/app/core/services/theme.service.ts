import { Injectable, signal } from '@angular/core';

/** The nine themeable palettes. `slate` is the dark-mode palette. */
export const THEMES = [
  'blue',
  'light',
  'slate',
  'grey',
  'purple',
  'amber',
  'emerald',
  'teal',
  'rose',
] as const;

export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'qaflaty.merchant.theme';
const DEFAULT_THEME: Theme = 'blue';

/**
 * Persists the merchant's palette choice and applies it by setting the
 * `data-theme` attribute on <html>. Palettes are pure CSS-variable swaps
 * (see styles/theme.css), so switching repaints instantly with no rebuild.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes = THEMES;
  readonly current = signal<Theme>(this.read());

  /** Apply the persisted (or default) theme to <html>. Call once at startup. */
  init(): void {
    this.apply(this.current());
  }

  set(theme: Theme): void {
    this.current.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — keep in-memory choice */
    }
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private read(): Theme {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return (THEMES as readonly string[]).includes(stored ?? '')
      ? (stored as Theme)
      : DEFAULT_THEME;
  }
}
