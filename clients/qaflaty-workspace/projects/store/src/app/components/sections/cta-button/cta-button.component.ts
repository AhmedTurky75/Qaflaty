import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

/**
 * Standalone call-to-action button. Content model:
 *   { text:{en,ar}, link, style:'primary'|'outline'|'dark', anchor }
 * When `anchor` is set the button scrolls to an in-page element with that id
 * (pairs with the `anchorId` section style setting from Phase A, e.g. an order
 * form), otherwise it routes to `link`.
 */
@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (text()) {
      <div class="py-8 px-4 text-center">
        @if (anchor()) {
          <button type="button" (click)="scrollToAnchor()" [class]="buttonClass()">{{ text() }}</button>
        } @else {
          <a [routerLink]="link()" [class]="buttonClass()">{{ text() }}</a>
        }
      </div>
    }
  `
})
export class CtaButtonComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  text = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.text?.ar : c.text?.en) || '';
  });

  link = computed(() => this.content().link || '/products');
  anchor = computed(() => (this.content().anchor || '').trim());
  private style = computed(() => this.content().style || 'primary');

  buttonClass = computed(() => {
    const base = 'inline-block px-8 py-3 font-semibold rounded-lg transition-colors cursor-pointer';
    switch (this.style()) {
      case 'outline':
        return `${base} border-2 border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white`;
      case 'dark':
        return `${base} bg-gray-900 text-white hover:bg-gray-800`;
      default:
        return `${base} bg-[var(--primary-color)] text-white hover:opacity-90`;
    }
  });

  scrollToAnchor(): void {
    const el = document.getElementById(this.anchor());
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
