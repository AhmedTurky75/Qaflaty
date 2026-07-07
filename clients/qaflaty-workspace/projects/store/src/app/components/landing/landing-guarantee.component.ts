import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-landing-guarantee',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-10">
      <div class="max-w-2xl mx-auto text-center bg-gray-50 border border-gray-200 rounded-2xl px-8 py-10">
        <div class="text-4xl mb-4">{{ icon() }}</div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">{{ title() }}</h3>
        <p class="text-gray-600 leading-relaxed">{{ text() }}</p>
      </div>
    </section>
  `
})
export class LandingGuaranteeComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  icon = computed(() => this.content().icon || '🛡️');

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || 'Satisfaction Guaranteed';
  });

  text = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.text?.ar : c.text?.en) || 'Not happy with your purchase? Return it within 14 days for a full refund, no questions asked.';
  });
}
