import { Component, computed, inject, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { contentOf, listOf } from '../section-config';

interface Testimonial {
  name: string;
  rating: number;
  text: string;
}

/** Sample quotes for a section the merchant has not written yet. */
const PLACEHOLDER: Testimonial[] = [
  { name: 'Ahmed', rating: 5, text: 'Great quality products and fast delivery. Highly recommended!' },
  { name: 'Sarah', rating: 5, text: 'Love the variety of products. Customer service is excellent.' },
  { name: 'Mohammed', rating: 5, text: 'Best online store I have ever shopped from. Will come back again!' }
];

@Component({
  selector: 'app-test-cards',
  standalone: true,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
      @if (title()) {
        <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">{{ title() }}</h2>
      }
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (testimonial of testimonials(); track $index) {
          <div class="bg-white p-6 rounded-xl shadow-sm">
            <div class="flex gap-1 mb-3">
              @for (star of stars(testimonial.rating); track $index) {
                <svg class="w-4 h-4" [class.text-yellow-400]="star" [class.text-gray-200]="!star" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              }
            </div>
            <p class="text-gray-600 text-sm mb-4">{{ testimonial.text }}</p>
            <p class="font-medium text-gray-900 text-sm">{{ testimonial.name }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class TestCardsComponent {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  title = computed(() => this.i18n.getText(contentOf(this.config())['title']));

  testimonials = computed<Testimonial[]>(() => {
    const written = listOf(this.config(), 'items')
      .map(item => ({
        name: typeof item['name'] === 'string' ? item['name'] : '',
        rating: typeof item['rating'] === 'number' ? item['rating'] : 5,
        text: this.i18n.getText(item['text'])
      }))
      .filter(item => item.text);

    return written.length ? written : PLACEHOLDER;
  });

  stars(rating: number): boolean[] {
    const filled = Math.max(0, Math.min(5, Math.round(rating)));
    return [0, 1, 2, 3, 4].map(i => i < filled);
  }
}
