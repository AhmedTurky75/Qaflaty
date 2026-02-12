import { Component, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-feat-cards',
  standalone: true,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (feature of features; track feature.title) {
          <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="w-10 h-10 bg-[var(--primary-color)]/10 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
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
  features = [
    { title: 'Free Shipping', description: 'On orders over 200 SAR' },
    { title: 'Secure Payment', description: '100% secure checkout' },
    { title: 'Easy Returns', description: '30-day return policy' },
    { title: '24/7 Support', description: 'Always here to help' }
  ];
}
