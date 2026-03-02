import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-hero-full-image',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden"
      [style.background-image]="imageUrl() ? 'url(' + imageUrl() + ')' : null"
      [style.background-size]="imageUrl() ? 'cover' : null"
      [style.background-position]="imageUrl() ? 'center' : null"
      [class.bg-gray-900]="!imageUrl()"
    >
      <div class="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"></div>
      <div class="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          {{ title() }}
        </h1>
        <p class="text-lg md:text-xl text-white/80 mb-8">
          {{ subtitle() }}
        </p>
        <a
          [routerLink]="buttonLink()"
          class="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          {{ buttonText() }}
        </a>
      </div>
    </div>
  `
})
export class HeroFullImageComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || 'Welcome to Our Store';
  });

  subtitle = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.subtitle?.ar : c.subtitle?.en) || 'Discover our amazing collection of products';
  });

  buttonText = computed(() => this.content().buttonText || 'Shop Now');
  buttonLink = computed(() => this.content().buttonLink || '/products');
  imageUrl = computed(() => this.content().imageUrl || null);
}
