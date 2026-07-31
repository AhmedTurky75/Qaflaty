import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-landing-cta-band',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-14 px-6 rounded-2xl bg-primary text-white text-center my-8">
      <h2 class="text-2xl md:text-3xl font-bold mb-3">{{ title() }}</h2>
      @if (subtitle()) {
        <p class="text-white/85 mb-6 max-w-xl mx-auto">{{ subtitle() }}</p>
      }
      <button
        (click)="scrollToBuyBox()"
        class="px-8 py-3.5 bg-white text-primary rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
      >
        {{ buttonText() }}
      </button>
    </section>
  `
})
export class LandingCtaBandComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || 'Ready to get yours?';
  });

  subtitle = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.subtitle?.ar : c.subtitle?.en) || '';
  });

  buttonText = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.buttonText?.ar : c.buttonText?.en) || 'Shop Now';
  });

  scrollToBuyBox() {
    document.getElementById('buy-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
