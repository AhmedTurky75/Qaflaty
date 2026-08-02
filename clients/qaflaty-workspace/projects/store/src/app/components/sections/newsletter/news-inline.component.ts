import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { contentOf } from '../section-config';

@Component({
  selector: 'app-news-inline',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-[var(--primary-color)] py-12 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl font-bold text-white mb-2">{{ title() }}</h2>
        @if (subtitle()) {
          <p class="text-white/80 mb-6">{{ subtitle() }}</p>
        }
        <div class="flex gap-2 max-w-md mx-auto">
          <input type="email" [(ngModel)]="email" [placeholder]="placeholder()"
            class="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white" />
          <button (click)="subscribe()" class="px-6 py-3 bg-white text-[var(--primary-color)] font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            {{ buttonText() }}
          </button>
        </div>
        @if (subscribed()) {
          <p class="mt-3 text-sm text-white/90">{{ thanks() }}</p>
        }
      </div>
    </div>
  `
})
export class NewsInlineComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  email = '';
  subscribed = signal(false);

  private content = computed(() => contentOf(this.config()));
  private arabic = computed(() => this.i18n.currentLanguage() === 'ar');

  title = computed(() =>
    this.i18n.getText(this.content()['title']) || (this.arabic() ? 'ابق على اطلاع' : 'Stay Updated'));

  subtitle = computed(() =>
    this.i18n.getText(this.content()['subtitle'])
    || (this.arabic() ? 'اشترك لتصلك أحدث العروض' : 'Subscribe to get the latest deals and offers'));

  placeholder = computed(() =>
    this.i18n.getText(this.content()['placeholder']) || (this.arabic() ? 'أدخل بريدك الإلكتروني' : 'Enter your email'));

  buttonText = computed(() =>
    this.i18n.getText(this.content()['buttonText']) || (this.arabic() ? 'اشترك' : 'Subscribe'));

  thanks = computed(() => this.arabic() ? 'شكرًا لاشتراكك!' : 'Thanks for subscribing!');

  subscribe() {
    if (this.email) {
      this.subscribed.set(true);
      this.email = '';
    }
  }
}
