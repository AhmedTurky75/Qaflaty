import { Component, OnInit, input, inject, signal } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { SectionContentService } from '../../../services/section-content.service';
import { Category } from '../../../models/category.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cats-icons',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="py-12 px-4 bg-white">
      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        @if (content?.title) {
          <div class="text-center mb-10">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {{ i18n.getText(content.title) }}
            </h2>
            @if (content.subtitle) {
              <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                {{ i18n.getText(content.subtitle) }}
              </p>
            }
          </div>
        }

        <!-- Category Icons Grid -->
        @if (categories().length > 0) {
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
            @for (category of categories(); track category.id) {
              <a
                [routerLink]="['/products']"
                [queryParams]="{ category: category.id }"
                class="group flex flex-col items-center text-center"
              >
                <!-- Circle Icon -->
                <div class="relative mb-3 w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                  @if (category.imageUrl) {
                    <img
                      [src]="category.imageUrl"
                      [alt]="i18n.nameFor(category.name, category.nameAr)"
                      class="w-full h-full object-cover"
                    />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-blue-600">
                      <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                  }

                  <!-- Hover Ring Effect -->
                  <div class="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <!-- Category Name -->
                <h3 class="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {{ i18n.nameFor(category.name, category.nameAr) }}
                </h3>

                <!-- Product Count (Optional) -->
                @if (category.productCount !== undefined) {
                  <p class="text-xs text-gray-500 mt-1">
                    {{ category.productCount }}
                  </p>
                }
              </a>
            }
          </div>
        } @else {
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <p class="text-gray-600">
              {{ i18n.currentLanguage() === 'ar' ? 'لا توجد فئات' : 'No categories found' }}
            </p>
          </div>
        }
      </div>
    </section>
  `
})
export class CatsIconsComponent implements OnInit {
  config = input.required<SectionConfigurationDto>();
  i18n = inject(I18nService);
  private sectionContent = inject(SectionContentService);

  categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.sectionContent.categories(this.config(), 8).subscribe({
      next: categories => this.categories.set(categories),
      error: () => this.categories.set([])
    });
  }

  get content(): any {
    try {
      return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {};
    } catch {
      return {};
    }
  }

  get settings(): any {
    try {
      return this.config().settingsJson ? JSON.parse(this.config().settingsJson!) : {};
    } catch {
      return {};
    }
  }
}
