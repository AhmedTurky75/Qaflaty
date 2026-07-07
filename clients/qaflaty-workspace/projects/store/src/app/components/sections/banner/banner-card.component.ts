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
        <div class="relative rounded-2xl shadow-2xl overflow-hidden bg-gray-900">
          @if (imageUrl()) {
            <!-- Image at its natural size, never cropped or darkened -->
            <img [src]="imageUrl()" [alt]="title() || 'Banner'" class="w-full h-auto" />
          }

          @if (title() || subtitle() || hasButton()) {
            <div class="absolute top-0 inset-x-0 pt-8 md:pt-12 px-8 md:px-16 text-center text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
              <div class="max-w-2xl mx-auto">
                @if (title()) {
                  <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    {{ title() }}
                  </h2>
                }

                @if (subtitle()) {
                  <p class="text-xl md:text-2xl mb-8 leading-relaxed">
                    {{ subtitle() }}
                  </p>
                }

                @if (hasButton()) {
                  <a
                    [routerLink]="buttonLink()"
                    class="inline-block underline font-bold hover:text-[var(--primary-color)] transition-colors"
                  >
                    {{ buttonText() }}
                  </a>
                }
              </div>
            </div>
          }
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
