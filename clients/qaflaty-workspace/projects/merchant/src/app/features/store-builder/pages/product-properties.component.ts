import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductPropertiesPanelComponent } from '../product-properties-panel.component';

@Component({
  selector: 'app-product-properties-page',
  standalone: true,
  imports: [RouterLink, ProductPropertiesPanelComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <a [routerLink]="'/store-builder'" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </a>
          <h1 class="text-lg font-semibold text-gray-900">Product Properties</h1>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <app-product-properties-panel />
      </div>
    </div>
  `
})
export class ProductPropertiesPageComponent {}
