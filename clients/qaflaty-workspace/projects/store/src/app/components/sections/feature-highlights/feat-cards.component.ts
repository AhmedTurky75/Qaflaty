import { Component, computed, inject, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { contentOf, listOf } from '../section-config';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

/** Shown until the merchant writes their own features. */
const PLACEHOLDER: Feature[] = [
  { icon: '🚚', title: 'Free Shipping', description: 'On all qualifying orders' },
  { icon: '🔒', title: 'Secure Payment', description: '100% secure checkout' },
  { icon: '↩️', title: 'Easy Returns', description: '30-day return policy' },
  { icon: '💬', title: '24/7 Support', description: 'Always here to help' }
];

@Component({
  selector: 'app-feat-cards',
  standalone: true,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12">
      @if (title()) {
        <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">{{ title() }}</h2>
      }
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (feature of features(); track $index) {
          <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="w-10 h-10 bg-[var(--primary-color)]/10 rounded-lg flex items-center justify-center mb-4 text-lg">
              {{ feature.icon }}
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">{{ feature.title }}</h3>
            <p class="text-sm text-gray-500">{{ feature.description }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class FeatCardsComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  title = computed(() => this.i18n.getText(contentOf(this.config())['title']));

  features = computed<Feature[]>(() => {
    const written = listOf(this.config(), 'items')
      .map(item => ({
        icon: typeof item['icon'] === 'string' ? item['icon'] : '✓',
        title: this.i18n.getText(item['title']),
        description: this.i18n.getText(item['text'])
      }))
      .filter(item => item.title || item.description);

    return written.length ? written : PLACEHOLDER;
  });
}
