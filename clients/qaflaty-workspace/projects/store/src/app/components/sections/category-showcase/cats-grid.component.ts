import { Component, input, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionConfigurationDto, CategoryIconComponent } from 'shared';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-cats-grid',
  standalone: true,
  imports: [RouterLink, CategoryIconComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
      <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        @for (category of categories(); track category.id) {
          <a [routerLink]="['/products']" [queryParams]="{ category: category.id }"
            class="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-center group">
            @if (category.imageUrl) {
              <img [src]="category.imageUrl" [alt]="i18n.nameFor(category.name, category.nameAr)"
                class="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
            } @else {
              <div class="w-16 h-16 bg-[var(--primary-color)]/10 rounded-full mx-auto mb-3 flex items-center justify-center text-[var(--primary-color)]">
                <lib-category-icon [name]="category.iconName" [size]="32" />
              </div>
            }
            <h3 class="font-medium text-gray-900 group-hover:text-[var(--primary-color)] transition-colors">{{ i18n.nameFor(category.name, category.nameAr) }}</h3>
          </a>
        }
      </div>
    </div>
  `
})
export class CatsGridComponent implements OnInit {
  config = input.required<SectionConfigurationDto>();
  private categoryService = inject(CategoryService);
  i18n = inject(I18nService);
  categories = signal<Category[]>([]);

  ngOnInit() {
    // The API already returns categories in the merchant's display order.
    this.categoryService.getCategories().subscribe(res => {
      this.categories.set(res || []);
    });
  }
}
