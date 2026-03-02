import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-hero-split',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="grid md:grid-cols-2 gap-0 min-h-[400px]">
      <div class="flex items-center justify-center p-8 md:p-16 bg-gray-50">
        <div class="max-w-md">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{{ title() }}</h1>
          <p class="text-gray-600 mb-6">{{ subtitle() }}</p>
          <a
            [routerLink]="buttonLink()"
            class="inline-block px-6 py-3 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {{ buttonText() }}
          </a>
        </div>
      </div>
      <div class="min-h-[300px] overflow-hidden">
        @if (imageUrl()) {
          <img
            [src]="imageUrl()!"
            [alt]="title()"
            class="w-full h-full object-cover"
          />
        } @else {
          <div class="w-full h-full bg-gray-200 flex items-center justify-center">
            <span class="text-gray-400 text-lg">Hero Image</span>
          </div>
        }
      </div>
    </div>
  `
})
export class HeroSplitComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || 'New Collection';
  });

  subtitle = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.subtitle?.ar : c.subtitle?.en) || 'Browse our latest arrivals and find something you love.';
  });

  buttonText = computed(() => this.content().buttonText || 'Browse Products');
  buttonLink = computed(() => this.content().buttonLink || '/products');
  imageUrl = computed(() => this.content().imageUrl || null);
}
