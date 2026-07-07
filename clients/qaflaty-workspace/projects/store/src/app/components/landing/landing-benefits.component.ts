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
