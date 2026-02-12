import { Component, input, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="py-16 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div class="max-w-4xl mx-auto">
        <!-- Newsletter Card -->
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div class="p-8 md:p-12 text-center">
            <!-- Icon -->
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <!-- Title -->
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              @if (content?.title) {
                {{ i18n.getText(content.title) }}
              } @else {
                {{ i18n.currentLanguage() === 'ar' ? 'اشترك في نشرتنا البريدية' : 'Subscribe to our newsletter' }}
              }
            </h2>

            <!-- Description -->
            <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              @if (content?.description) {
                {{ i18n.getText(content.description) }}
              } @else {
                {{ i18n.currentLanguage() === 'ar' ? 'احصل على آخر العروض والتحديثات مباشرة إلى بريدك الإلكتروني' : 'Get the latest offers and updates delivered directly to your inbox' }}
              }
            </p>

            <!-- Email Form -->
            <form (submit)="onSubmit($event)" class="max-w-lg mx-auto">
              <div class="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  [placeholder]="i18n.currentLanguage() === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'"
                  class="flex-grow px-6 py-4 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  class="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 whitespace-nowrap"
                >
                  {{ i18n.currentLanguage() === 'ar' ? 'اشترك' : 'Subscribe' }}
                </button>
              </div>

              @if (submitted) {
                <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p class="text-green-700 font-medium">
                    {{ i18n.currentLanguage() === 'ar' ? 'شكراً لاشتراكك!' : 'Thank you for subscribing!' }}
                  </p>
                </div>
              }
            </form>

            <!-- Privacy Note -->
            <p class="text-sm text-gray-500 mt-6">
              {{ i18n.currentLanguage() === 'ar' ? 'نحن نحترم خصوصيتك. لن نشارك بريدك الإلكتروني مع أي طرف ثالث.' : 'We respect your privacy. Your email will never be shared with third parties.' }}
            </p>
          </div>

          <!-- Decorative Background Pattern -->
          <div class="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
        </div>
      </div>
    </section>
  `
})
export class NewsCardComponent {
  config = input.required<SectionConfigurationDto>();
  i18n = inject(I18nService);
  email = '';
  submitted = false;

  get content(): any {
    try {
      return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {};
    } catch {
      return {};
    }
  }

  get settings(): any {
    try {
      return this.config().settingsJson ? JSON.parse(this.config().settingsJson!) : {};
    } catch {
      return {};
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.email) {
      // TODO: Implement newsletter subscription logic
      console.log('Newsletter subscription:', this.email);
      this.submitted = true;
      this.email = '';

      // Reset success message after 5 seconds
      setTimeout(() => {
        this.submitted = false;
      }, 5000);
    }
  }
}
