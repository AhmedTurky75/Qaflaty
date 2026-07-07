import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-banner-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="py-12 px-4 bg-white">
      <div class="max-w-7xl mx-auto">
        <div class="relative rounded-2xl shadow-2xl overflow-hidden bg-gray-900 min-h-[400px] flex items-center">
          @if (imageUrl()) {
            <img
              [src]="imageUrl()"
              [alt]="title()"
              class="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          } @else {
            <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-80"></div>
          }

          <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>

          <div class="relative z-10 w-full px-8 md:px-16 py-12">
            <div class="max-w-2xl">
              @if (title()) {
                <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  {{ title() }}
                </h2>
              }

              @if (subtitle()) {
                <p class="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                  {{ subtitle() }}
                </p>
              }

              @if (hasButton()) {
                <a
                  [routerLink]="buttonLink()"
                  class="inline-block px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {{ buttonText() }}
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class BannerCardComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || '';
  });

  subtitle = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.subtitle?.ar : c.subtitle?.en) || '';
  });

  buttonText = computed(() => this.content().buttonText || '');
  buttonLink = computed(() => this.content().buttonLink || '/products');
  hasButton = computed(() => !!this.buttonText());
  imageUrl = computed(() => this.content().imageUrl || null);
}
