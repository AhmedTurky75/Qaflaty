import { Component, input, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-cats-grid',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
      <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        @for (category of categories(); track category.id) {
          <a [routerLink]="['/products']" [queryParams]="{ categoryId: category.id }"
            class="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-center group">
            <div class="w-16 h-16 bg-[var(--primary-color)]/10 rounded-full mx-auto mb-3 flex items-center justify-center">
              <svg class="w-8 h-8 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 class="font-medium text-gray-900 group-hover:text-[var(--primary-color)] transition-colors">{{ category.name }}</h3>
          </a>
        }
      </div>
    </div>
  `
})
export class CatsGridComponent implements OnInit {
  config = input.required<SectionConfigurationDto>();
  private categoryService = inject(CategoryService);
  categories = signal<any[]>([]);

  ngOnInit() {
    this.categoryService.getCategories().subscribe(res => {
      this.categories.set(res || []);
    });
  }
}
