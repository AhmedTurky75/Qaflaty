import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center px-4">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p class="text-xl text-gray-600 mb-8">{{ t('page_not_found') }}</p>
        <a routerLink="/" class="inline-block px-6 py-3 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
          {{ t('back_to_home') }}
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  private i18n = inject(I18nService);
  t(key: string): string { return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key; }
}
