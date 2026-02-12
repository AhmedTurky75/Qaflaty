import { Component, input, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-banner-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="py-12 px-4 bg-white">
      <div class="max-w-7xl mx-auto">
        <!-- Banner Card -->
        <div class="relative rounded-2xl shadow-2xl overflow-hidden bg-gray-900 min-h-[400px] flex items-center">
          <!-- Background Image -->
          @if (content?.backgroundImage) {
            <img
              [src]="content.backgroundImage.url"
              [alt]="i18n.getText(content.title)"
              class="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          } @else {
            <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-80"></div>
          }

          <!-- Gradient Overlay -->
          <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>

          <!-- Content -->
          <div class="relative z-10 w-full px-8 md:px-16 py-12">
            <div class="max-w-2xl">
              <!-- Badge / Label -->
              @if (content?.badge) {
                <div class="inline-block mb-4">
                  <span class="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                    {{ i18n.getText(content.badge) }}
                  </span>
                </div>
              }

              <!-- Title -->
              <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                @if (content?.title) {
                  {{ i18n.getText(content.title) }}
                } @else {
                  {{ i18n.currentLanguage() === 'ar' ? 'عرض خاص' : 'Special Offer' }}
                }
              </h2>

              <!-- Description -->
              @if (content?.description) {
                <p class="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                  {{ i18n.getText(content.description) }}
                </p>
              }

              <!-- Call to Action Buttons -->
              <div class="flex flex-wrap gap-4">
                @if (content?.primaryButton) {
                  <a
                    [routerLink]="content.primaryButton.link || '/products'"
                    class="inline-block px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {{ i18n.getText(content.primaryButton.text) }}
                  </a>
                } @else {
                  <a
                    routerLink="/products"
                    class="inline-block px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {{ i18n.currentLanguage() === 'ar' ? 'تسوق الآن' : 'Shop Now' }}
                  </a>
                }

                @if (content?.secondaryButton) {
                  <a
                    [routerLink]="content.secondaryButton.link || '/about'"
                    class="inline-block px-8 py-4 bg-transparent text-white font-bold rounded-lg border-2 border-white hover:bg-white hover:text-gray-900 transition-all duration-200"
                  >
                    {{ i18n.getText(content.secondaryButton.text) }}
                  </a>
                }
              </div>

              <!-- Additional Info -->
              @if (content?.additionalInfo) {
                <div class="mt-8 flex items-center gap-3 text-white/80">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm">{{ i18n.getText(content.additionalInfo) }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Decorative Element -->
          @if (settings?.showDecorative) {
            <div class="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          }
        </div>
      </div>
    </section>
  `
})
export class BannerCardComponent {
  config = input.required<SectionConfigurationDto>();
  i18n = inject(I18nService);

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
}
