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
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
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
