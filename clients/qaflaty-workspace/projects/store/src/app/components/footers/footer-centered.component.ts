import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { FeatureService } from '../../services/feature.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';

@Component({
  selector: 'app-footer-centered',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-white border-t border-gray-200 py-8">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <p class="font-bold text-lg text-gray-900 mb-4">{{ store.currentStore()?.name }}</p>
        <nav class="flex flex-wrap justify-center gap-4 mb-6 text-sm text-gray-600">
          <a routerLink="/" class="hover:text-[var(--primary-color)]">{{ t('home') }}</a>
          <a routerLink="/products" class="hover:text-[var(--primary-color)]">{{ t('products') }}</a>
          @if (features.isAboutPageEnabled()) { <a routerLink="/about" class="hover:text-[var(--primary-color)]">{{ t('about') }}</a> }
          @if (features.isContactPageEnabled()) { <a routerLink="/contact" class="hover:text-[var(--primary-color)]">{{ t('contact') }}</a> }
        </nav>
        <p class="text-xs text-gray-400">&copy; {{ year }} {{ store.currentStore()?.name }}. {{ t('powered_by') }}</p>
      </div>
    </footer>
  `
})
export class FooterCenteredComponent {
  store = inject(StoreService);
  features = inject(FeatureService);
  private i18n = inject(I18nService);
  year = new Date().getFullYear();

  t(key: string): string {
    return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key;
  }
}
