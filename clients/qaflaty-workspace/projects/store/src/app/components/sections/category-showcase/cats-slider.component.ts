import { Component, input, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cats-slider',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="py-12 px-4 bg-gray-50">
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

        <!-- Horizontally Scrollable Category Cards -->
        @if (content?.categories && content.categories.length > 0) {
          <div class="relative">
            <div class="overflow-x-auto scrollbar-hide pb-4">
              <div class="flex gap-6" style="scroll-snap-type: x mandatory;">
                @for (category of content.categories; track category.id) {
                  <a
                    [routerLink]="['/categories', category.slug]"
                    class="flex-shrink-0 w-64 scroll-snap-align-start group"
                  >
                    <div class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <!-- Category Image -->
                      <div class="aspect-video overflow-hidden bg-gray-100">
                        @if (category.image) {
                          <img
                            [src]="category.image.url"
                            [alt]="i18n.getText(category.name)"
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        } @else {
                          <div class="w-full h-full flex items-center justify-center text-gray-400">
                            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                          </div>
                        }
                      </div>

                      <!-- Category Info -->
                      <div class="p-4">
                        <h3 class="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {{ i18n.getText(category.name) }}
                        </h3>
                        @if (category.description) {
                          <p class="text-sm text-gray-600 line-clamp-2">
                            {{ i18n.getText(category.description) }}
                          </p>
                        }
                        @if (category.productCount !== undefined) {
                          <p class="text-sm text-gray-500 mt-2">
                            {{ category.productCount }} {{ i18n.currentLanguage() === 'ar' ? 'منتج' : 'products' }}
                          </p>
                        }
                      </div>
                    </div>
                  </a>
                }
              </div>
            </div>

            <!-- Scroll Hint Gradient -->
            <div class="absolute top-0 right-0 bottom-4 w-16 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
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

    <style>
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    </style>
  `
})
export class CatsSliderComponent {
  config = input.required<SectionConfigurationDto>();
  i18n = inject(I18nService);

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
