import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-hero-minimal',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="py-16 md:py-24 bg-[var(--primary-color)] text-white text-center px-4">
      <h1 class="text-3xl md:text-5xl font-bold mb-4">{{ title() }}</h1>
      <p class="text-lg text-white/80 mb-8 max-w-xl mx-auto">{{ subtitle() }}</p>
      <a
        [routerLink]="buttonLink()"
        class="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
      >
        {{ buttonText() }}
      </a>
    </div>
  `
})
export class HeroMinimalComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || 'Our Store';
  });

  subtitle = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.subtitle?.ar : c.subtitle?.en) || 'Find the perfect products for you';
  });

  buttonText = computed(() => this.content().buttonText || 'View Products');
  buttonLink = computed(() => this.content().buttonLink || '/products');
}
