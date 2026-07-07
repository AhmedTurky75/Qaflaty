import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-banner-strip',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (imageUrl()) {
      <!-- Image shown at its natural size, never cropped or darkened; text overlaid on top, no background -->
      <div class="relative w-full">
        <img [src]="imageUrl()" [alt]="title() || 'Banner'" class="w-full h-auto" />
        @if (title() || subtitle() || hasButton()) {
          <div class="absolute top-0 inset-x-0 pt-4 px-4 text-center text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
            @if (title()) { <span class="font-semibold">{{ title() }}</span> }
            @if (subtitle()) { <span class="ms-1">{{ subtitle() }}</span> }
            @if (hasButton()) {
              <a [routerLink]="buttonLink()" class="underline ms-2 hover:text-[var(--primary-color)] transition-colors">{{ buttonText() }}</a>
            }
          </div>
        }
      </div>
    } @else if (title() || subtitle() || hasButton()) {
      <!-- Text-only strip -->
      <div class="bg-gray-900 text-white py-3 px-4 text-center">
        <p class="text-sm">
          @if (title()) { <span class="font-semibold">{{ title() }}</span> }
          @if (subtitle()) { <span class="ms-1">{{ subtitle() }}</span> }
          @if (hasButton()) {
            <a [routerLink]="buttonLink()" class="underline ms-2 hover:text-[var(--primary-color)] transition-colors">{{ buttonText() }}</a>
          }
        </p>
      </div>
    }
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
