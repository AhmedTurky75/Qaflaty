import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';
import { Product } from '../../models/product.model';

type MediaTextLayout = 'side' | 'below' | 'overlay';
type AnchorPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface MediaTextItem {
  imageUrl: string;
  title: string;
  text: string;
  reverse?: boolean;
  layout: MediaTextLayout;
  overlayPosition: AnchorPosition;
  scrim: 'none' | 'dark' | 'light';
  textColor: string;
  maxWidth: 'narrow' | 'medium' | 'wide';
}

/**
 * Alternating image/text rows. Each row picks a layout:
 *  - side: image and text side by side (optionally reversed)
 *  - below: image on top, text stacked underneath, full width
 *  - overlay: text laid over the image, anchored to one of 9 fixed grid
 *    positions (never free-dragged) so it stays legible at every breakpoint —
 *    object-fit: cover crops images differently per viewport width, so pixel
 *    coordinates chosen in the editor wouldn't line up on other screen sizes.
 */
@Component({
  selector: 'app-landing-media-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-12 space-y-16">
      @for (item of items(); track $index) {
        @switch (item.layout) {
          @case ('below') {
            <div class="space-y-5" [class.flex]="item.reverse" [class.flex-col-reverse]="item.reverse">
              <div class="rounded-xl overflow-hidden bg-gray-50 aspect-[16/9]">
                <img [src]="item.imageUrl" [alt]="item.title" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div class="max-w-2xl mx-auto text-center">
                <h3 class="text-2xl font-bold text-gray-900 mb-4">{{ item.title }}</h3>
                <p class="text-gray-600 leading-relaxed whitespace-pre-line">{{ item.text }}</p>
              </div>
            </div>
          }
          @case ('overlay') {
            <div class="relative rounded-xl overflow-hidden bg-gray-900 aspect-[4/3] md:aspect-[16/9]">
              <img [src]="item.imageUrl" [alt]="item.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              @if (item.scrim !== 'none') {
                <div class="absolute inset-0" [class]="scrimClass(item.scrim)"></div>
              }
              <div class="absolute inset-0 flex p-6 md:p-10" [class]="anchorClasses(item.overlayPosition)">
                <div [class]="maxWidthClass(item.maxWidth) + ' ' + textAlignClass(item.overlayPosition)" [style.color]="item.textColor">
                  <h3 class="text-2xl md:text-3xl font-bold mb-3">{{ item.title }}</h3>
                  <p class="leading-relaxed whitespace-pre-line opacity-90">{{ item.text }}</p>
                </div>
              </div>
            </div>
          }
          @default {
            <div class="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div class="rounded-xl overflow-hidden bg-gray-50 aspect-[4/3]" [class.md:order-2]="item.reverse">
                <img [src]="item.imageUrl" [alt]="item.title" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div [class.md:order-1]="item.reverse">
                <h3 class="text-2xl font-bold text-gray-900 mb-4">{{ item.title }}</h3>
                <p class="text-gray-600 leading-relaxed whitespace-pre-line">{{ item.text }}</p>
              </div>
            </div>
          }
        }
      }
    </section>
  `
})
export class LandingMediaTextComponent {
  config = input.required<SectionConfigurationDto>();
  product = input<Product | null>(null);
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  items = computed<MediaTextItem[]>(() => {
    const lang = this.i18n.currentLanguage();
    const rawItems: any[] = Array.isArray(this.content().items) ? this.content().items : [];
    const productImages = this.product()?.images ?? [];

    return rawItems.map((item, index) => ({
      imageUrl: item.imageUrl || productImages[index]?.url || productImages[0]?.url || '',
      title: (lang === 'ar' ? item.title?.ar : item.title?.en) || '',
      text: (lang === 'ar' ? item.text?.ar : item.text?.en) || '',
      reverse: !!item.reverse,
      layout: (item.layout === 'below' || item.layout === 'overlay') ? item.layout : 'side',
      overlayPosition: item.overlayPosition || 'bottom-left',
      scrim: item.scrim === 'light' || item.scrim === 'none' ? item.scrim : 'dark',
      textColor: item.textColor || '#ffffff',
      maxWidth: item.maxWidth === 'narrow' || item.maxWidth === 'wide' ? item.maxWidth : 'medium'
    }));
  });

  private readonly vAnchor: Record<string, string> = {
    top: 'items-start', center: 'items-center', bottom: 'items-end'
  };
  private readonly hAnchor: Record<string, string> = {
    left: 'justify-start', center: 'justify-center', right: 'justify-end'
  };
  private readonly hAlign: Record<string, string> = {
    left: 'text-start', center: 'text-center', right: 'text-end'
  };
  private readonly widthClasses: Record<string, string> = {
    narrow: 'max-w-xs', medium: 'max-w-md', wide: 'max-w-xl'
  };

  private splitPosition(position: AnchorPosition): { v: string; h: string } {
    const [v, h] = position.split('-');
    return { v, h: h || 'center' };
  }

  anchorClasses(position: AnchorPosition): string {
    const { v, h } = this.splitPosition(position);
    return `${this.vAnchor[v] || 'items-end'} ${this.hAnchor[h] || 'justify-start'}`;
  }

  textAlignClass(position: AnchorPosition): string {
    const { h } = this.splitPosition(position);
    return this.hAlign[h] || 'text-start';
  }

  maxWidthClass(width: string): string {
    return this.widthClasses[width] || this.widthClasses['medium'];
  }

  scrimClass(scrim: string): string {
    return scrim === 'light' ? 'bg-white/40' : 'bg-black/40';
  }
}
