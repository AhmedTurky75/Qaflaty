import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

/**
 * Standalone call-to-action button. Content model:
 *   { text:{en,ar}, style:'primary'|'outline'|'dark',
 *     action:'link'|'anchor'|'whatsapp'|'phone', link, anchor, phone,
 *     whatsapp, message:{en,ar} }
 * - link: routes internally (RouterLink)
 * - anchor: smooth-scrolls to an in-page element id (pairs with Phase A anchorId)
 * - whatsapp: opens wa.me with an optional prefilled message
 * - phone: tel: dialer
 */
@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (text()) {
      <div class="py-8 px-4 text-center">
        @switch (action()) {
          @case ('anchor') {
            <button type="button" (click)="scrollToAnchor()" [class]="buttonClass()">{{ text() }}</button>
          }
          @case ('whatsapp') {
            <a [href]="whatsappHref()" target="_blank" rel="noopener" [class]="buttonClass()">{{ text() }}</a>
          }
          @case ('phone') {
            <a [href]="phoneHref()" [class]="buttonClass()">{{ text() }}</a>
          }
          @default {
            <a [routerLink]="link()" [class]="buttonClass()">{{ text() }}</a>
          }
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

  /** Explicit action, or inferred from legacy content (anchor set → anchor). */
  action = computed<string>(() => {
    const a = this.content().action;
    if (a) return a;
    return this.anchor() ? 'anchor' : 'link';
  });

  private message = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.message?.ar : c.message?.en) || '';
  });

  whatsappHref = computed(() => {
    const num = String(this.content().whatsapp || '').replace(/[^0-9]/g, '');
    const text = this.message() ? `?text=${encodeURIComponent(this.message())}` : '';
    return `https://wa.me/${num}${text}`;
  });

  phoneHref = computed(() => `tel:${String(this.content().phone || '').replace(/\s+/g, '')}`);

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
