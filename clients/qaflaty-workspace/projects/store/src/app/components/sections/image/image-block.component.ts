import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

/**
 * Plain full-width image block. Content model:
 *   { imageUrl, alt, link, caption:{en,ar} }
 * For the many edge-to-edge marketing images (text baked into the image).
 * Optionally links somewhere and/or shows a caption underneath. Full styling
 * (max-width, padding, radius, animation) comes from the section wrapper.
 */
@Component({
  selector: 'app-image-block',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (imageUrl()) {
      <figure class="w-full m-0">
        @if (isExternal()) {
          <a [href]="link()" target="_blank" rel="noopener"><img [src]="imageUrl()" [alt]="alt()" class="w-full h-auto block" /></a>
        } @else if (link()) {
          <a [routerLink]="link()"><img [src]="imageUrl()" [alt]="alt()" class="w-full h-auto block" /></a>
        } @else {
          <img [src]="imageUrl()" [alt]="alt()" class="w-full h-auto block" />
        }
        @if (caption()) {
          <figcaption class="text-center text-sm text-gray-500 mt-2 px-4">{{ caption() }}</figcaption>
        }
      </figure>
    }
  `
})
export class ImageBlockComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  imageUrl = computed(() => this.content().imageUrl || '');
  alt = computed(() => this.content().alt || '');
  link = computed(() => (this.content().link || '').trim());
  isExternal = computed(() => /^https?:\/\//i.test(this.link()));

  caption = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.caption?.ar : c.caption?.en) || '';
  });
}
