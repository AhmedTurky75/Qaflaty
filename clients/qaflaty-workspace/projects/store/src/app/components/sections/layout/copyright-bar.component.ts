import { Component, computed, inject, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { StoreService } from '../../../services/store.service';
import { I18nService, TRANSLATIONS } from '../../../services/i18n.service';
import { contentOf } from '../section-config';

/**
 * The closing line of the footer. `{year}` and `{store}` in the merchant's text
 * are filled in, so the year never goes stale.
 */
@Component({
  selector: 'app-copyright-bar',
  standalone: true,
  template: `
    <div class="bg-gray-900 text-gray-500 border-t border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-5 text-center text-sm">
        <p>{{ text() }}</p>
      </div>
    </div>
  `
})
export class CopyrightBarComponent {
  config = input.required<SectionConfigurationDto>();

  private store = inject(StoreService);
  private i18n = inject(I18nService);

  text = computed(() => {
    const written = this.i18n.getText(contentOf(this.config())['text']);
    const storeName = this.store.currentStore()?.name ?? '';
    const template = written || `© {year} {store}. ${this.t('all_rights_reserved')}.`;

    return template
      .replace(/\{year\}/g, String(new Date().getFullYear()))
      .replace(/\{store\}/g, storeName);
  });

  private t(key: string): string {
    return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key;
  }
}
