import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-hero-minimal',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="py-16 md:py-24 bg-[var(--primary-color)] text-white text-center px-4">
      <h1 class="text-3xl md:text-5xl font-bold mb-4">Our Store</h1>
      <p class="text-lg text-white/80 mb-8 max-w-xl mx-auto">Find the perfect products for you</p>
      <a routerLink="/products" class="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
        View Products
      </a>
    </div>
  `
})
export class HeroMinimalComponent {
  config = input.required<SectionConfigurationDto>();
}
