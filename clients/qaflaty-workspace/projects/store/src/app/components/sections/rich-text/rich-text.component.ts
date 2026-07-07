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
      <div class="max-w-3xl mx-auto px-4 py-8 prose prose-sm sm:prose max-w-none" [innerHTML]="html()"></div>
    }
  `
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
