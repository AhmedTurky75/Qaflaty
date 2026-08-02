import { Component, ElementRef, OnInit, inject, input, signal, viewChild } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { SectionContentService } from '../../../services/section-content.service';
import { Product } from '../../../models/product.model';
import { CardStandardComponent } from '../../products/card-standard.component';
import { CommonModule } from '@angular/common';

const CARD_WIDTH = 312; // w-72 card + gap-6

@Component({
  selector: 'app-carousel-standard',
  standalone: true,
  imports: [CommonModule, CardStandardComponent],
  template: `
    <section class="py-12 px-4 bg-white">
      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        @if (content?.title) {
          <div class="flex items-center justify-between mb-10">
            <div>
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {{ i18n.getText(content.title) }}
              </h2>
              @if (content.subtitle) {
                <p class="text-lg text-gray-600">
                  {{ i18n.getText(content.subtitle) }}
                </p>
              }
            </div>

            <!-- Navigation Arrows -->
            @if (products().length > 3) {
              <div class="hidden md:flex gap-2">
                <button
                  (click)="scrollByCards(-1)"
                  class="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                  type="button"
                  aria-label="Previous"
                >
                  <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  (click)="scrollByCards(1)"
                  class="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                  type="button"
                  aria-label="Next"
                >
                  <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            }
          </div>
        }

        <!-- Product Carousel -->
        @if (isLoading()) {
          <div class="flex gap-6 overflow-hidden">
            @for (i of skeletons; track i) {
              <div class="w-72 flex-shrink-0">
                <div class="bg-gray-100 rounded-lg animate-pulse aspect-square"></div>
              </div>
            }
          </div>
        } @else if (products().length > 0) {
          <div class="relative">
            <div
              #carouselContainer
              class="overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style="scroll-snap-type: x mandatory;"
            >
              <div class="flex gap-6" style="width: fit-content;">
                @for (product of products(); track product.id) {
                  <div class="w-72 flex-shrink-0" style="scroll-snap-align: start;">
                    <app-card-standard [product]="product" />
                  </div>
                }
              </div>
            </div>

            <!-- Scroll Indicators -->
            @if (products().length > 3) {
              <div class="flex justify-center gap-2 mt-6">
                @for (dot of dots(); track $index) {
                  <button
                    (click)="scrollToIndex($index)"
                    [class.bg-blue-600]="currentIndex() === $index"
                    [class.bg-gray-300]="currentIndex() !== $index"
                    class="w-2 h-2 rounded-full transition-colors duration-200"
                    type="button"
                    [attr.aria-label]="'Go to slide ' + ($index + 1)"
                  ></button>
                }
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="text-gray-600">
              {{ i18n.currentLanguage() === 'ar' ? 'لا توجد منتجات' : 'No products found' }}
            </p>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class CarouselStandardComponent implements OnInit {
  config = input.required<SectionConfigurationDto>();
  i18n = inject(I18nService);
  private sectionContent = inject(SectionContentService);

  /** Scoped to this carousel — a page can hold more than one. */
  private container = viewChild<ElementRef<HTMLElement>>('carouselContainer');

  products = signal<Product[]>([]);
  isLoading = signal(true);
  currentIndex = signal(0);
  readonly skeletons = [1, 2, 3, 4];

  ngOnInit(): void {
    this.sectionContent.products(this.config(), 8).subscribe({
      next: products => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  get content(): any {
    try {
      return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {};
    } catch {
      return {};
    }
  }

  dots(): number[] {
    return Array.from({ length: Math.ceil(this.products().length / 3) }, (_, i) => i);
  }

  scrollByCards(direction: number): void {
    const el = this.container()?.nativeElement;
    if (!el) return;

    el.scrollBy({ left: direction * CARD_WIDTH, behavior: 'smooth' });
    const maxIndex = Math.max(0, this.dots().length - 1);
    this.currentIndex.set(Math.max(0, Math.min(maxIndex, this.currentIndex() + direction)));
  }

  scrollToIndex(index: number): void {
    const el = this.container()?.nativeElement;
    if (!el) return;

    el.scrollTo({ left: index * CARD_WIDTH * 3, behavior: 'smooth' });
    this.currentIndex.set(index);
  }
}
