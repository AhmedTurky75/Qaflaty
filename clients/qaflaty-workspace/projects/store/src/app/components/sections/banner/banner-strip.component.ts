import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-banner-strip',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="bg-gray-900 text-white py-3 px-4 text-center">
      <p class="text-sm">
        <span class="font-semibold">Special Offer!</span> Free shipping on all orders over 200 SAR
        <a routerLink="/products" class="underline ms-2 hover:text-[var(--primary-color)] transition-colors">Shop Now</a>
      </p>
    </div>
  `
})
export class BannerStripComponent {
  config = input.required<SectionConfigurationDto>();
}
