import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';
import { Product } from '../../models/product.model';

interface MediaTextItem {
  imageUrl: string;
  title: string;
  text: string;
  reverse?: boolean;
}

@Component({
  selector: 'app-landing-media-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-12 space-y-16">
      @for (item of items(); track $index) {
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
      reverse: !!item.reverse
    }));
  });
}
