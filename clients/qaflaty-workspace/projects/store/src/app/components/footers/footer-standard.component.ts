import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { FeatureService } from '../../services/feature.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';

@Component({
  selector: 'app-footer-standard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-gray-900 text-white pt-12 pb-6">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 class="font-bold text-lg mb-4">{{ store.currentStore()?.name }}</h3>
            <p class="text-gray-400 text-sm">{{ store.currentStore()?.description || '' }}</p>
          </div>
          <div>
            <h4 class="font-semibold mb-4">{{ t('products') }}</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a routerLink="/products" class="hover:text-white transition-colors">{{ t('all_categories') }}</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Links</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              @if (features.isAboutPageEnabled()) {
                <li><a routerLink="/about" class="hover:text-white transition-colors">{{ t('about') }}</a></li>
              }
              @if (features.isContactPageEnabled()) {
                <li><a routerLink="/contact" class="hover:text-white transition-colors">{{ t('contact') }}</a></li>
              }
              @if (features.isFaqPageEnabled()) {
                <li><a routerLink="/faq" class="hover:text-white transition-colors">{{ t('faq') }}</a></li>
              }
              @if (features.isTermsPageEnabled()) {
                <li><a routerLink="/terms" class="hover:text-white transition-colors">{{ t('terms') }}</a></li>
              }
              @if (features.isPrivacyPageEnabled()) {
                <li><a routerLink="/privacy" class="hover:text-white transition-colors">{{ t('privacy') }}</a></li>
              }
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {{ year }} {{ store.currentStore()?.name }}. {{ t('all_rights_reserved') }}. {{ t('powered_by') }}</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterStandardComponent {
  store = inject(StoreService);
  features = inject(FeatureService);
  private i18n = inject(I18nService);
  year = new Date().getFullYear();

  t(key: string): string {
    return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key;
  }
}
