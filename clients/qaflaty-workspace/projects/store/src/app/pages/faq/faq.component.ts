import { Component, inject, signal, OnInit } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';
import { FaqItemDto } from 'shared';

@Component({
  selector: 'app-faq',
  standalone: true,
  template: `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ t('faq') }}</h1>
      <div class="space-y-4">
        @for (item of faqItems(); track item.id) {
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <button (click)="toggle(item.id)" class="w-full px-6 py-4 text-start flex items-center justify-between bg-white hover:bg-gray-50">
              <span class="font-medium text-gray-900">{{ i18n.getText(item.question) }}</span>
              <svg class="w-5 h-5 text-gray-500 transition-transform" [class.rotate-180]="openId() === item.id" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            @if (openId() === item.id) {
              <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p class="text-gray-600">{{ i18n.getText(item.answer) }}</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class FaqComponent implements OnInit {
  private configService = inject(ConfigService);
  i18n = inject(I18nService);
  faqItems = signal<FaqItemDto[]>([]);
  openId = signal<string | null>(null);

  t(key: string): string { return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key; }

  ngOnInit() {
    this.configService.getFaqItems().subscribe(items => this.faqItems.set(items));
  }

  toggle(id: string) {
    this.openId.set(this.openId() === id ? null : id);
  }
}
