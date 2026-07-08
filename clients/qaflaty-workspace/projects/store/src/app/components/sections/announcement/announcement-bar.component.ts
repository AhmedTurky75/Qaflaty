import { Component, input, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

/**
 * Announcement bar. Content model:
 *   { text: {en,ar}, link, bg, textColor, dismissible }
 * Renders a slim full-width strip. When dismissible, the dismissal is remembered
 * per section id in localStorage for the session.
 */
@Component({
  selector: 'app-announcement-bar',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (text() && !dismissed()) {
      <div class="w-full text-center text-sm py-2 px-4 relative"
        [style.background-color]="bg()" [style.color]="textColor()">
        @if (link()) {
          <a [routerLink]="link()" class="font-medium hover:underline">{{ text() }}</a>
        } @else {
          <span class="font-medium">{{ text() }}</span>
        }
        @if (dismissible()) {
          <button type="button" (click)="dismiss()"
            class="absolute top-1/2 end-3 -translate-y-1/2 opacity-70 hover:opacity-100"
            aria-label="Dismiss">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        }
      </div>
    }
  `
})
export class AnnouncementBarComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private dismissedSig = signal(false);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  text = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.text?.ar : c.text?.en) || '';
  });

  link = computed(() => this.content().link || '');
  bg = computed(() => this.content().bg || '#111827');
  textColor = computed(() => this.content().textColor || '#ffffff');
  dismissible = computed(() => this.content().dismissible === true);

  private storageKey = computed(() => `announcement-dismissed:${this.config().id}`);

  dismissed = computed(() => {
    if (!this.dismissible()) return false;
    if (this.dismissedSig()) return true;
    try { return sessionStorage.getItem(this.storageKey()) === '1'; }
    catch { return false; }
  });

  dismiss(): void {
    this.dismissedSig.set(true);
    try { sessionStorage.setItem(this.storageKey(), '1'); } catch { /* ignore */ }
  }
}
