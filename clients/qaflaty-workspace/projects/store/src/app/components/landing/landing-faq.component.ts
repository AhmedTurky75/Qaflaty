import { Component, input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../services/i18n.service';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-landing-faq',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-12 max-w-3xl mx-auto">
      @if (title()) {
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">{{ title() }}</h2>
      }
      <div class="space-y-3">
        @for (item of items(); track $index; let i = $index) {
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <button
              (click)="toggle(i)"
              class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {{ item.question }}
              <span class="text-xl leading-none transition-transform shrink-0" [class.rotate-45]="isOpen(i)">+</span>
            </button>
            @if (isOpen(i)) {
              <div class="px-5 pb-4 text-gray-600 leading-relaxed whitespace-pre-line">{{ item.answer }}</div>
            }
          </div>
        }
      </div>
    </section>
  `
})
export class LandingFaqComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || 'Frequently Asked Questions';
  });

  items = computed<FaqItem[]>(() => {
    const lang = this.i18n.currentLanguage();
    const rawItems: any[] = Array.isArray(this.content().items) ? this.content().items : [];
    return rawItems.map(item => ({
      question: (lang === 'ar' ? item.question?.ar : item.question?.en) || '',
      answer: (lang === 'ar' ? item.answer?.ar : item.answer?.en) || ''
    }));
  });

  openIndex = signal<number | null>(0);

  isOpen(i: number): boolean {
    return this.openIndex() === i;
  }

  toggle(i: number) {
    this.openIndex.set(this.isOpen(i) ? null : i);
  }
}
