import { Component, input, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-grid-standard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Featured Products</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        @for (product of products(); track product.id) {
          <a [routerLink]="['/products', product.slug]" class="group block">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              @if (product.firstImageUrl) {
                <img [src]="product.firstImageUrl" [alt]="product.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              }
            </div>
            <h3 class="text-sm font-medium text-gray-900 group-hover:text-[var(--primary-color)] transition-colors truncate">{{ product.name }}</h3>
            <p class="text-sm font-semibold text-[var(--primary-color)] mt-1">{{ product.price }} SAR</p>
          </a>
        }
      </div>
    </div>
  `
})
export class GridStandardComponent implements OnInit {
  config = input.required<SectionConfigurationDto>();
  private productService = inject(ProductService);
  products = signal<any[]>([]);

  ngOnInit() {
    this.productService.getProducts().subscribe(res => {
      this.products.set(res.items?.slice(0, 8) || []);
    });
  }
}
