import { Component, inject, signal, computed, SecurityContext } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ConfigService } from '../../services/config.service';
import { FeatureService } from '../../services/feature.service';
import { Product, ProductFilter, ProductSortBy } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ProductCardComponent } from '../../components/products/product-card.component';
import { I18nService } from '../../services/i18n.service';
import { TrackingService } from '../../services/tracking.service';
import { FilterablePropertyDefinition, CategoryIconComponent } from 'shared';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, NgClass, RouterModule, FormsModule, ProductCardComponent, CategoryIconComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private configService = inject(ConfigService);
  readonly featureService = inject(FeatureService);
  readonly i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tracking = inject(TrackingService);
  private sanitizer = inject(DomSanitizer);

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

  showPropertyFilters = computed(() =>
    this.featureService.isProductSearchEnabled() && (this.searchSettings()?.enablePropertyFilters ?? false));

  filterablePropertyDefinitions = computed<FilterablePropertyDefinition[]>(() =>
    this.configService.config()?.filterablePropertyDefinitions ?? []);

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

  // Map of definitionId -> Set of selected values
  selectedPropertyValues = signal<Map<string, Set<string>>>(new Map());

  activeFiltersCount = computed(() => {
    const propFilterCount = Array.from(this.selectedPropertyValues().values())
      .reduce((acc, set) => acc + set.size, 0);
    return [this.selectedCategory(), this.searchQuery() || null, this.minPrice(), this.maxPrice()]
      .filter(v => v !== null).length + propFilterCount;
  });

  gridClass = computed(() => {
    switch (this.featureService.productGridVariant()) {
      case 'grid-2': return 'grid-cols-2 gap-6';
      case 'grid-4': return 'grid-cols-2 lg:grid-cols-4 gap-6';
      case 'grid-masonry': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  });

  currentCategory = computed(() => {
    const catId = this.selectedCategory();
    return catId ? this.categories().find(c => c.id === catId) : null;
  });

  /**
   * Merchant-authored HTML for the open category, rendered above the product grid. Sanitized here
   * (scripts and event handlers stripped) because the markup is authored in the merchant dashboard
   * and stored verbatim.
   */
  categoryContent = computed(() => {
    const category = this.currentCategory();
    if (!category) return '';

    const raw = this.i18n.currentLanguage() === 'ar'
      ? (category.contentHtmlAr || category.contentHtml)
      : (category.contentHtml || category.contentHtmlAr);

    return raw ? this.sanitizer.sanitize(SecurityContext.HTML, raw) : '';
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

      // Restore property filters from query params: "pf_<definitionId>" = comma-separated values
      const newMap = new Map<string, Set<string>>();
      for (const key of Object.keys(params)) {
        if (key.startsWith('pf_')) {
          const defId = key.slice(3);
          const values = (params[key] as string).split(',').filter(Boolean);
          if (values.length > 0) newMap.set(defId, new Set(values));
        }
      }
      this.selectedPropertyValues.set(newMap);

      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading.set(true);

    const propertyFilters: string[] = [];
    this.selectedPropertyValues().forEach((values, defId) => {
      values.forEach(val => propertyFilters.push(`${defId}:${val}`));
    });

    const filter: ProductFilter = {
      categoryId: this.selectedCategory() || undefined,
      search: this.searchQuery() || undefined,
      sortBy: this.sortBy(),
      minPrice: this.minPrice() ?? undefined,
      maxPrice: this.maxPrice() ?? undefined,
      page: this.currentPage(),
      pageSize: this.pageSize,
      propertyFilters: propertyFilters.length > 0 ? propertyFilters : undefined
    };

    this.productService.getProducts(filter).subscribe({
      next: (result) => {
        this.products.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
        if (filter.search) {
          // customerRef identifies the visitor (fed to Meta as external_id) — it must not carry
          // the search term itself, or every search corrupts the matching parameter with
          // unrelated text. Let it default to the visitor id like every other tracked event.
          this.tracking.track('Search');
        }
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

  isPropertyValueSelected(definitionId: string, value: string): boolean {
    return this.selectedPropertyValues().get(definitionId)?.has(value) ?? false;
  }

  getFirstPropertyValue(definitionId: string): string {
    const set = this.selectedPropertyValues().get(definitionId);
    return set && set.size > 0 ? Array.from(set)[0] : '';
  }

  setPropertyTextValue(definitionId: string, value: string): void {
    const current = new Map(this.selectedPropertyValues());
    if (value.trim()) {
      current.set(definitionId, new Set([value.trim()]));
    } else {
      current.delete(definitionId);
    }
    this.selectedPropertyValues.set(current);
    this.applyPropertyFilters();
  }

  togglePropertyValue(definitionId: string, value: string): void {
    const current = new Map(this.selectedPropertyValues());
    const selected = new Set(current.get(definitionId) ?? []);

    if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }

    if (selected.size === 0) {
      current.delete(definitionId);
    } else {
      current.set(definitionId, selected);
    }

    this.selectedPropertyValues.set(current);
    this.applyPropertyFilters();
  }

  private applyPropertyFilters(): void {
    const params: Record<string, string | null> = { page: '1' };
    this.selectedPropertyValues().forEach((values, defId) => {
      params[`pf_${defId}`] = values.size > 0 ? Array.from(values).join(',') : null;
    });
    // Clear removed definition keys
    const currentParams = this.route.snapshot.queryParams;
    for (const key of Object.keys(currentParams)) {
      if (key.startsWith('pf_') && !params.hasOwnProperty(key)) {
        params[key] = null;
      }
    }
    this.updateQueryParams(params);
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
