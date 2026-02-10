import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService, ProductFilters } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { ProductCardComponent } from '../components/product-card/product-card.component';
import { StoreContextService } from '../../../core/services/store-context.service';
import { ProductDto, CategoryDto, ProductStatus } from 'shared';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private storeContext = inject(StoreContextService);

  products = signal<ProductDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  selectedStatus = signal<ProductStatus | ''>('');
  selectedCategory = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(12);
  totalProducts = signal(0);
  totalPages = computed(() => Math.ceil(this.totalProducts() / this.pageSize()));

  Math = Math;
  ProductStatus = ProductStatus;
  productStatusOptions = [
    { value: '', label: 'All Status' },
    { value: ProductStatus.Active, label: 'Active' },
    { value: ProductStatus.Inactive, label: 'Inactive' },
    { value: ProductStatus.Draft, label: 'Draft' }
  ];

  // View mode
  viewMode = signal<'grid' | 'list'>('grid');

  constructor() {
    effect(() => {
      const storeId = this.storeContext.currentStoreId();
      if (storeId) {
        this.loadCategories();
        this.loadProducts();
      }
    });
  }

  ngOnInit(): void {
    // Initial load handled by the effect
  }

  loadCategories(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.categoryService.getCategories(storeId).subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
      }
    });
  }

  loadProducts(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.error.set('Please select a store first');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const filters: ProductFilters = {
      page: this.currentPage(),
      limit: this.pageSize()
    };

    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }
    if (this.selectedStatus()) {
      filters.status = this.selectedStatus() as ProductStatus;
    }
    if (this.selectedCategory()) {
      filters.categoryId = this.selectedCategory();
    }

    this.productService.getProducts(storeId, filters).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.totalProducts.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load products');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDeleteProduct(productId: string): void {
    const storeId = this.storeContext.currentStoreId() || '';
    this.productService.deleteProduct(storeId, productId).subscribe({
      next: () => {
        this.products.update(products => products.filter(p => p.id !== productId));
        this.totalProducts.update(total => total - 1);
      },
      error: (err) => {
        alert(`Failed to delete product: ${err.message}`);
      }
    });
  }

  onToggleStatus(productId: string): void {
    const product = this.products().find(p => p.id === productId);
    if (!product) return;

    const newStatus = product.status === ProductStatus.Active ? ProductStatus.Inactive : ProductStatus.Active;

    const storeId = this.storeContext.currentStoreId() || '';
    this.productService.updateProductStatus(storeId, productId, newStatus).subscribe({
      next: (updatedProduct) => {
        this.products.update(products =>
          products.map(p => p.id === productId ? updatedProduct : p)
        );
      },
      error: (err) => {
        alert(`Failed to update product status: ${err.message}`);
      }
    });
  }

  navigateToCreateProduct(): void {
    this.router.navigate(['/products/new']);
  }

  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots.filter(x => typeof x === 'number') as number[];
  }
}
