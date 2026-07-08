import { Component, input, computed, inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

/**
 * Rich text block. Content model: { html: {en, ar} }.
 * The HTML is authored in the merchant editor and **sanitized here on render**
 * (Angular's DomSanitizer strips scripts/handlers) before being injected.
 */
@Component({
  selector: 'app-rich-text',
  standalone: true,
  template: `
    @if (html()) {
      <div class="qf-rich max-w-3xl mx-auto px-4 py-8 text-gray-800 leading-relaxed" [innerHTML]="html()"></div>
    }
  `,
  styles: [`
    :host ::ng-deep .qf-rich h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 .5rem; }
    :host ::ng-deep .qf-rich h3 { font-size: 1.25rem; font-weight: 600; margin: .85rem 0 .4rem; }
    :host ::ng-deep .qf-rich p { margin: .6rem 0; }
    :host ::ng-deep .qf-rich ul { list-style: disc; padding-inline-start: 1.5rem; margin: .6rem 0; }
    :host ::ng-deep .qf-rich ol { list-style: decimal; padding-inline-start: 1.5rem; margin: .6rem 0; }
    :host ::ng-deep .qf-rich li { margin: .2rem 0; }
    :host ::ng-deep .qf-rich a { color: var(--primary-color, #2563eb); text-decoration: underline; }
    :host ::ng-deep .qf-rich strong, :host ::ng-deep .qf-rich b { font-weight: 700; }
    :host ::ng-deep .qf-rich em, :host ::ng-deep .qf-rich i { font-style: italic; }
  `]
})
export class RichTextComponent {
  config = input.required<SectionConfigurationDto>();
  private sanitizer = inject(DomSanitizer);
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  html = computed(() => {
    const c = this.content();
    const raw = (this.i18n.currentLanguage() === 'ar' ? c.html?.ar : c.html?.en) || '';
    return raw ? this.sanitizer.sanitize(SecurityContext.HTML, raw) : '';
  });
}
