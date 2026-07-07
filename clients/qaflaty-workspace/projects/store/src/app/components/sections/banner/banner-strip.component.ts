import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-banner-strip',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="relative py-3 px-4 text-center text-white overflow-hidden"
      [class.bg-gray-900]="!imageUrl()"
      [style.background-image]="imageUrl() ? 'url(' + imageUrl() + ')' : null"
      [style.background-size]="imageUrl() ? 'cover' : null"
      [style.background-position]="imageUrl() ? 'center' : null"
    >
      @if (imageUrl()) {
        <div class="absolute inset-0 bg-black/50"></div>
      }
      <p class="relative z-10 text-sm">
        <span class="font-semibold">{{ title() }}</span>
        @if (subtitle()) {
          <span class="ms-1">{{ subtitle() }}</span>
        }
        <a [routerLink]="buttonLink()" class="underline ms-2 hover:text-[var(--primary-color)] transition-colors">{{ buttonText() }}</a>
      </p>
    </div>
  `
})
export class BannerStripComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || 'Special Offer!';
  });

  subtitle = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.subtitle?.ar : c.subtitle?.en) || 'Free shipping on all qualifying orders';
  });

  buttonText = computed(() => this.content().buttonText || 'Shop Now');
  buttonLink = computed(() => this.content().buttonLink || '/products');
  imageUrl = computed(() => this.content().imageUrl || null);
}
