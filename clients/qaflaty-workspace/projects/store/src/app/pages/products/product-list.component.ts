import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ConfigService } from '../../services/config.service';
import { FeatureService } from '../../services/feature.service';
import { Product, ProductFilter, ProductSortBy } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ProductCardComponent } from '../../components/products/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, NgClass, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private configService = inject(ConfigService);
  readonly featureService = inject(FeatureService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly ALL_SORT_OPTIONS = [
    { value: ProductSortBy.Newest, label: 'Newest' },
    { value: ProductSortBy.NameAsc, label: 'Name (A-Z)' },
    { value: ProductSortBy.NameDesc, label: 'Name (Z-A)' },
    { value: ProductSortBy.PriceAsc, label: 'Price: Low to High' },
    { value: ProductSortBy.PriceDesc, label: 'Price: High to Low' },
    { value: ProductSortBy.BestSelling, label: 'Best Selling' },
  ];

  private searchSettings = computed(() => this.configService.config()?.searchSettings);

  showTextSearch = computed(() =>
    this.featureService.isProductSearchEnabled() && (this.searchSettings()?.enableTextSearch ?? true));

  showCategoryFilter = computed(() =>
    this.featureService.isProductSearchEnabled() && (this.searchSettings()?.enableCategoryFilter ?? true));

  showPriceFilter = computed(() =>
    this.featureService.isProductSearchEnabled() && (this.searchSettings()?.enablePriceFilter ?? true));

  visibleSortOptions = computed(() => {
    const allowed = this.searchSettings()?.allowedSortOptions;
    if (!allowed || allowed.length === 0) return this.ALL_SORT_OPTIONS;
    return this.ALL_SORT_OPTIONS.filter(o => allowed.includes(o.value));
  });

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal<boolean>(true);

  selectedCategory = signal<string | null>(null);
  searchQuery = signal<string>('');
  sortBy = signal<string>(ProductSortBy.Newest);
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  currentPage = signal<number>(1);
  totalCount = signal<number>(0);
  totalPages = signal<number>(0);
  pageSize = 12;
  sidebarOpen = signal<boolean>(false);

  activeFiltersCount = computed(() =>
    [this.selectedCategory(), this.searchQuery() || null, this.minPrice(), this.maxPrice()]
      .filter(v => v !== null).length
  );

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

    if (current - delta > 2) range.unshift(-1);
    if (current + delta < total - 1) range.push(-1);

    range.unshift(1);
    if (total > 1) range.push(total);

    return range.filter((v, i, a) => a.indexOf(v) === i && v !== -1);
  });

  ngOnInit() {
    this.loadCategories();

    this.route.queryParams.subscribe(params => {
      this.selectedCategory.set(params['category'] || null);
      this.searchQuery.set(params['search'] || '');
      this.sortBy.set(params['sortBy'] || ProductSortBy.Newest);
      this.minPrice.set(params['minPrice'] ? Number(params['minPrice']) : null);
      this.maxPrice.set(params['maxPrice'] ? Number(params['maxPrice']) : null);
      this.currentPage.set(parseInt(params['page'] || '1'));
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading.set(true);

    const filter: ProductFilter = {
      categoryId: this.selectedCategory() || undefined,
      search: this.searchQuery() || undefined,
      sortBy: this.sortBy(),
      minPrice: this.minPrice() ?? undefined,
      maxPrice: this.maxPrice() ?? undefined,
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

  onSortChange(value: string) {
    this.sortBy.set(value);
    this.updateQueryParams({ sortBy: value, page: 1 });
  }

  onSearchSubmit() {
    this.updateQueryParams({ search: this.searchQuery() || null, page: 1 });
  }

  onMinPriceInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.minPrice.set(val ? Number(val) : null);
  }

  onMaxPriceInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.maxPrice.set(val ? Number(val) : null);
  }

  onPriceChange() {
    this.updateQueryParams({
      minPrice: this.minPrice() ?? null,
      maxPrice: this.maxPrice() ?? null,
      page: 1
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.updateQueryParams({ page });
    }
  }

  clearFilters() {
    this.router.navigate(['/products']);
  }

  clearMinPrice() {
    this.minPrice.set(null);
    this.onPriceChange();
  }

  clearMaxPrice() {
    this.maxPrice.set(null);
    this.onPriceChange();
  }

  private updateQueryParams(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }
}
