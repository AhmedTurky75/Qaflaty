import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/** Supported UI languages. Arabic drives RTL layout. */
export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];
export type Direction = 'ltr' | 'rtl';

const STORAGE_KEY = 'qaflaty.merchant.lang';
const DEFAULT_LANG: Language = 'en';

/**
 * Owns the UI language (English / Arabic) and the resulting layout direction.
 * Sets `lang` and `dir` on <html> and drives Transloco's active language, so
 * RTL is handled by the `dir` attribute + Tailwind's `rtl:` variant.
 */
@Injectable({ providedIn: 'root' })
export class DirectionService {
  private readonly transloco = inject(TranslocoService);

  readonly languages = LANGUAGES;
  readonly lang = signal<Language>(this.read());
  readonly dir = computed<Direction>(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));
  readonly isRtl = computed(() => this.dir() === 'rtl');

  /** Apply the persisted (or default) language & direction. Call once at startup. */
  init(): void {
    this.apply(this.lang());
  }

  setLang(lang: Language): void {
    this.lang.set(lang);
    this.apply(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — keep in-memory choice */
    }
  }

  toggle(): void {
    this.setLang(this.lang() === 'en' ? 'ar' : 'en');
  }

  private apply(lang: Language): void {
    this.transloco.setActiveLang(lang);
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  private read(): Language {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return (LANGUAGES as readonly string[]).includes(stored ?? '')
      ? (stored as Language)
      : DEFAULT_LANG;
  }
}
