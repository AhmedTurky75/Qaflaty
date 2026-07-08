import { Component, input, computed, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

interface CompRow {
  feature: string;
  us: boolean;
  them: boolean;
}

/**
 * Comparison table (us vs. the alternative). Content model:
 *   { title:{en,ar}, usLabel:{en,ar}, themLabel:{en,ar},
 *     rows:[{ feature:{en,ar}, us:bool, them:bool }] }
 */
@Component({
  selector: 'app-comparison-standard',
  standalone: true,
  template: `
    <div class="py-12 px-4">
      @if (title()) {
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">{{ title() }}</h2>
      }
      @if (rows().length) {
        <div class="max-w-2xl mx-auto overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <div class="grid grid-cols-[1fr_auto_auto]">
            <!-- Header -->
            <div class="bg-gray-50 px-4 py-3"></div>
            <div class="bg-[var(--primary-color)] text-white px-4 py-3 text-center text-sm font-semibold min-w-[5.5rem]">{{ usLabel() }}</div>
            <div class="bg-gray-100 text-gray-600 px-4 py-3 text-center text-sm font-semibold min-w-[5.5rem]">{{ themLabel() }}</div>
            <!-- Rows -->
            @for (row of rows(); track $index) {
              <div class="px-4 py-3 text-sm text-gray-700 border-t border-gray-100 flex items-center">{{ row.feature }}</div>
              <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-center bg-[var(--primary-color)]/5">
                @if (row.us) {
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                }
              </div>
              <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-center">
                @if (row.them) {
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ComparisonStandardComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  private t(field: any): string {
    return (this.i18n.currentLanguage() === 'ar' ? field?.ar : field?.en) || '';
  }

  title = computed(() => this.t(this.content().title));
  usLabel = computed(() => this.t(this.content().usLabel) || 'Us');
  themLabel = computed(() => this.t(this.content().themLabel) || 'Others');

  rows = computed<CompRow[]>(() => {
    const raw: any[] = Array.isArray(this.content().rows) ? this.content().rows : [];
    return raw.map(r => ({
      feature: this.t(r.feature),
      us: r.us !== false,
      them: r.them === true
    }));
  });
}
