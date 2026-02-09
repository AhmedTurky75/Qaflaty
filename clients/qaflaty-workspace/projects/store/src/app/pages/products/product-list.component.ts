import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product, ProductFilter, ProductSortBy } from '../../models/product.model';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4">
        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          @if (currentCategory()) {
            <p class="text-gray-600">Category: {{ currentCategory()!.name }}</p>
          }
        </div>

        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Filters Sidebar -->
          <aside class="lg:w-64 shrink-0">
            <div class="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 class="font-semibold text-lg mb-4">Filters</h2>

              <!-- Categories -->
              @if (categories().length > 0) {
                <div class="mb-6">
                  <h3 class="font-medium text-gray-900 mb-3">Categories</h3>
                  <ul class="space-y-2">
                    <li>
                      <button
                        (click)="filterByCategory(null)"
                        [class.text-primary]="!selectedCategory()"
                        [class.font-semibold]="!selectedCategory()"
                        class="text-left text-gray-600 hover:text-primary transition-colors w-full"
                      >
                        All Products
                      </button>
                    </li>
                    @for (category of categories(); track category.id) {
                      <li>
                        <button
                          (click)="filterByCategory(category.id)"
                          [class.text-primary]="selectedCategory() === category.id"
                          [class.font-semibold]="selectedCategory() === category.id"
                          class="text-left text-gray-600 hover:text-primary transition-colors w-full"
                        >
                          {{ category.name }}
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }

              <!-- Sort By -->
              <div class="mb-6">
                <h3 class="font-medium text-gray-900 mb-3">Sort By</h3>
                <select
                  [(ngModel)]="sortBy"
                  (ngModelChange)="onSortChange()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option [ngValue]="'Newest'">Newest</option>
                  <option [ngValue]="'NameAsc'">Name (A-Z)</option>
                  <option [ngValue]="'NameDesc'">Name (Z-A)</option>
                  <option [ngValue]="'PriceLowHigh'">Price: Low to High</option>
                  <option [ngValue]="'PriceHighLow'">Price: High to Low</option>
                </select>
              </div>

              <!-- Clear Filters -->
              @if (selectedCategory() || searchQuery()) {
                <button
                  (click)="clearFilters()"
                  class="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              }
            </div>
          </aside>

          <!-- Products Grid -->
          <main class="flex-1">
            <!-- Search and Results Count -->
            <div class="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <span class="text-gray-600">
                  {{ totalCount() }} {{ totalCount() === 1 ? 'product' : 'products' }} found
                </span>
              </div>

              <!-- Mobile Sort -->
              <div class="md:hidden">
                <select
                  [(ngModel)]="sortBy"
                  (ngModelChange)="onSortChange()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option [ngValue]="'Newest'">Newest</option>
                  <option [ngValue]="'NameAsc'">Name (A-Z)</option>
                  <option [ngValue]="'NameDesc'">Name (Z-A)</option>
                  <option [ngValue]="'PriceLowHigh'">Price: Low to High</option>
                  <option [ngValue]="'PriceHighLow'">Price: High to Low</option>
                </select>
              </div>
            </div>

            <!-- Loading State -->
            @if (loading()) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (item of [1,2,3,4,5,6]; track item) {
                  <div class="animate-pulse bg-white rounded-lg shadow p-4">
                    <div class="bg-gray-300 h-64 rounded mb-4"></div>
                    <div class="bg-gray-300 h-4 rounded mb-2"></div>
                    <div class="bg-gray-300 h-4 rounded w-2/3"></div>
                  </div>
                }
              </div>
            }

            <!-- Products Grid -->
            @else if (products().length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                @for (product of products(); track product.id) {
                  <a
                    [routerLink]="['/products', product.slug]"
                    class="group bg-white rounded-lg shadow hover:shadow-xl transition-all overflow-hidden"
                  >
                    <!-- Product Image -->
                    <div class="relative aspect-square overflow-hidden bg-gray-100">
                      @if (product.images.length > 0) {
                        <img
                          [src]="product.images[0].url"
                          [alt]="product.images[0].altText || product.name"
                          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        >
                      } @else {
                        <div class="w-full h-full flex items-center justify-center">
                          <svg class="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      }

                      <!-- Discount Badge -->
                      @if (product.pricing.hasDiscount) {
                        <div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{{ product.pricing.discountPercentage }}%
                        </div>
                      }

                      <!-- Out of Stock Badge -->
                      @if (!product.inventory.inStock) {
                        <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span class="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">
                            Out of Stock
                          </span>
                        </div>
                      }
                    </div>

                    <!-- Product Info -->
                    <div class="p-4">
                      <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {{ product.name }}
                      </h3>
                      <div class="flex items-center gap-2">
                        <span class="text-xl font-bold text-gray-900">
                          {{ product.pricing.price.amount.toFixed(2) }} {{ product.pricing.price.currency }}
                        </span>
                        @if (product.pricing.compareAtPrice) {
                          <span class="text-sm text-gray-500 line-through">
                            {{ product.pricing.compareAtPrice.amount.toFixed(2) }} {{ product.pricing.compareAtPrice.currency }}
                          </span>
                        }
                      </div>
                      @if (product.inventory.lowStock && product.inventory.inStock) {
                        <p class="text-xs text-orange-500 mt-2">Only {{ product.inventory.quantity }} left!</p>
                      }
                    </div>
                  </a>
                }
              </div>

              <!-- Pagination -->
              @if (totalPages() > 1) {
                <div class="flex justify-center items-center gap-2">
                  <button
                    (click)="goToPage(currentPage() - 1)"
                    [disabled]="currentPage() === 1"
                    class="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  @for (page of pageNumbers(); track page) {
                    <button
                      (click)="goToPage(page)"
                      [class.bg-primary]="page === currentPage()"
                      [class.text-white]="page === currentPage()"
                      [class.hover:bg-primary-dark]="page === currentPage()"
                      class="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {{ page }}
                    </button>
                  }

                  <button
                    (click)="goToPage(currentPage() + 1)"
                    [disabled]="currentPage() === totalPages()"
                    class="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              }
            }

            <!-- Empty State -->
            @else {
              <div class="bg-white rounded-lg shadow p-12 text-center">
                <svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                <p class="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                <button
                  (click)="clearFilters()"
                  class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            }
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal<boolean>(true);

  selectedCategory = signal<string | null>(null);
  searchQuery = signal<string>('');
  sortBy = signal<string>('Newest');
  currentPage = signal<number>(1);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  pageSize = 12;

  currentCategory = computed(() => {
    const catId = this.selectedCategory();
    return catId ? this.categories().find(c => c.id === catId) : null;
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift(-1); // Ellipsis
    }
    if (current + delta < total - 1) {
      range.push(-1); // Ellipsis
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    return range.filter((v, i, a) => a.indexOf(v) === i && v !== -1);
  });

  ngOnInit() {
    this.loadCategories();

    // Subscribe to query params
    this.route.queryParams.subscribe(params => {
      this.selectedCategory.set(params['category'] || null);
      this.searchQuery.set(params['search'] || '');
      this.sortBy.set(params['sortBy'] || 'Newest');
      this.currentPage.set(parseInt(params['page'] || '1'));

      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading.set(true);

    const filter: ProductFilter = {
      categoryId: this.selectedCategory() || undefined,
      search: this.searchQuery() || undefined,
      sortBy: this.sortBy() as ProductSortBy,
      page: this.currentPage(),
      pageSize: this.pageSize
    };

    this.productService.getProducts(filter).subscribe({
      next: (result) => {
        this.products.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.loading.set(false);
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Failed to load categories:', error)
    });
  }

  filterByCategory(categoryId: string | null) {
    this.updateQueryParams({ category: categoryId, page: 1 });
  }

  onSortChange() {
    this.updateQueryParams({ sortBy: this.sortBy(), page: 1 });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.updateQueryParams({ page });
    }
  }

  clearFilters() {
    this.router.navigate(['/products']);
  }

  private updateQueryParams(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }
}
