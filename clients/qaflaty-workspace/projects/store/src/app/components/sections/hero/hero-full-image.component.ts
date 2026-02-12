import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-hero-full-image',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="relative h-[60vh] min-h-[400px] bg-gray-900 flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"></div>
      <div class="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          Welcome to Our Store
        </h1>
        <p class="text-lg md:text-xl text-white/80 mb-8">
          Discover our amazing collection of products
        </p>
        <a routerLink="/products" class="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
          Shop Now
        </a>
      </div>
    </div>
  `
})
export class HeroFullImageComponent {
  config = input.required<SectionConfigurationDto>();
}
