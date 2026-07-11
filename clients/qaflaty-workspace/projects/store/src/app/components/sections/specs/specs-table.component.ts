import { Component, input, computed, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';

interface SpecRow { label: string; value: string; }
interface SpecGroup { name: string; rows: SpecRow[]; }

/**
 * Specifications table. Content model:
 *   { title:{en,ar}, groups:[{ name:{en,ar}, rows:[{ label:{en,ar}, value:{en,ar} }] }] }
 * Renders grouped label → value rows (Network, Display, Camera, Battery…).
 */
@Component({
  selector: 'app-specs-table',
  standalone: true,
  template: `
    @if (groups().length) {
      <div class="max-w-3xl mx-auto px-4 py-10">
        @if (title()) {
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">{{ title() }}</h2>
        }
        <div class="divide-y divide-gray-200 rounded-xl border border-gray-200 overflow-hidden">
          @for (group of groups(); track $index) {
            @if (group.name) {
              <div class="bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900">{{ group.name }}</div>
            }
            @for (row of group.rows; track $index) {
              <div class="grid grid-cols-3 gap-3 px-4 py-3">
                <div class="col-span-1 text-sm text-gray-500">{{ row.label }}</div>
                <div class="col-span-2 text-sm text-gray-800">{{ row.value }}</div>
              </div>
            }
          }
        </div>
      </div>
    }
  `
})
export class SpecsTableComponent {
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

  groups = computed<SpecGroup[]>(() => {
    const raw: any[] = Array.isArray(this.content().groups) ? this.content().groups : [];
    return raw.map(g => ({
      name: this.t(g.name),
      rows: (Array.isArray(g.rows) ? g.rows : [])
        .map((r: any) => ({ label: this.t(r.label), value: this.t(r.value) }))
        .filter((r: SpecRow) => r.label || r.value)
    })).filter(g => g.name || g.rows.length);
  });
}
