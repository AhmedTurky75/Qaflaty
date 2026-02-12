import { Component, inject } from '@angular/core';
import { StoreService } from '../../services/store.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';

@Component({
  selector: 'app-footer-minimal',
  standalone: true,
  template: `
    <footer class="bg-gray-100 py-6">
      <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <p>&copy; {{ year }} {{ store.currentStore()?.name }}. {{ t('all_rights_reserved') }}</p>
        <p class="text-gray-400">{{ t('powered_by') }}</p>
      </div>
    </footer>
  `
})
export class FooterMinimalComponent {
  store = inject(StoreService);
  private i18n = inject(I18nService);
  year = new Date().getFullYear();

  t(key: string): string {
    return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key;
  }
}
