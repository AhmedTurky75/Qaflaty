import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';

interface BenefitItem {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-landing-benefits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-12">
      @if (title()) {
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">{{ title() }}</h2>
      }
      @if (isStrip()) {
        <!-- Compact horizontal trust-badge strip -->
        <div class="flex flex-wrap justify-center gap-x-10 gap-y-6 px-4">
          @for (benefit of items(); track $index) {
            <div class="flex items-center gap-3 max-w-xs">
              <div class="w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {{ benefit.icon }}
              </div>
              <div class="text-start">
                <h3 class="font-semibold text-sm text-gray-900">{{ benefit.title }}</h3>
                @if (benefit.text) { <p class="text-gray-500 text-xs leading-snug">{{ benefit.text }}</p> }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          @for (benefit of items(); track $index) {
            <div class="text-center px-4">
              <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                {{ benefit.icon }}
              </div>
              <h3 class="font-semibold text-lg text-gray-900 mb-2">{{ benefit.title }}</h3>
              <p class="text-gray-600 text-sm leading-relaxed">{{ benefit.text }}</p>
            </div>
          }
        </div>
      }
    </section>
  `
})
export class LandingBenefitsComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  isStrip = computed(() => this.config().variantId === 'benefits-strip');

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || '';
  });

  items = computed<BenefitItem[]>(() => {
    const lang = this.i18n.currentLanguage();
    const rawItems: any[] = Array.isArray(this.content().items) ? this.content().items : [];
    return rawItems.map(item => ({
      icon: item.icon || '',
      title: (lang === 'ar' ? item.title?.ar : item.title?.en) || '',
      text: (lang === 'ar' ? item.text?.ar : item.text?.en) || ''
    }));
  });
}
