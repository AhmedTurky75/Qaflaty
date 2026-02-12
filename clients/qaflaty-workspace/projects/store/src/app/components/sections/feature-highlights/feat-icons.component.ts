import { Component, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-feat-icons',
  standalone: true,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        @for (feature of features; track feature.title) {
          <div class="text-center p-4">
            <div class="w-12 h-12 mx-auto mb-3 text-[var(--primary-color)]" [innerHTML]="feature.icon"></div>
            <h3 class="font-semibold text-gray-900 text-sm">{{ feature.title }}</h3>
            <p class="text-xs text-gray-500 mt-1">{{ feature.description }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class FeatIconsComponent {
  config = input.required<SectionConfigurationDto>();

  features = [
    { icon: '<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg>', title: 'Free Shipping', description: 'On orders over 200 SAR' },
    { icon: '<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>', title: 'Secure Payment', description: '100% secure checkout' },
    { icon: '<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>', title: 'Easy Returns', description: '30-day return policy' },
    { icon: '<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', title: '24/7 Support', description: 'Always here to help' }
  ];
}
