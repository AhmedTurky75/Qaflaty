import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-hero-split',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="grid md:grid-cols-2 gap-0 min-h-[400px]">
      <div class="flex items-center justify-center p-8 md:p-16 bg-gray-50">
        <div class="max-w-md">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">New Collection</h1>
          <p class="text-gray-600 mb-6">Browse our latest arrivals and find something you love.</p>
          <a routerLink="/products" class="inline-block px-6 py-3 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Browse Products
          </a>
        </div>
      </div>
      <div class="bg-gray-200 min-h-[300px] flex items-center justify-center">
        <span class="text-gray-400 text-lg">Hero Image</span>
      </div>
    </div>
  `
})
export class HeroSplitComponent {
  config = input.required<SectionConfigurationDto>();
}
