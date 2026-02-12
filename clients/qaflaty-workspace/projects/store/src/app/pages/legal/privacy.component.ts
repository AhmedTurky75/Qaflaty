import { Component, inject, OnInit } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ t('privacy') }}</h1>
      @if (page?.contentJson) {
        <div class="prose max-w-none" [innerHTML]="page.contentJson"></div>
      } @else {
        <p class="text-gray-600">Privacy policy content will be configured in the store builder.</p>
      }
    </div>
  `
})
export class PrivacyComponent implements OnInit {
  private configService = inject(ConfigService);
  private i18n = inject(I18nService);
  page: any;
  t(key: string): string { return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key; }
  ngOnInit() { this.configService.getPageBySlug('privacy').subscribe(p => this.page = p); }
}
