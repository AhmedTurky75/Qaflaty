import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService, ProductFilters, ImportProductsResult } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { ProductCardComponent } from '../components/product-card/product-card.component';
import { StoreContextService } from '../../../core/services/store-context.service';
import {  CategoryDto, ProductDto, ProductStatus } from 'shared';

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

  // Bulk CSV import
  importing = signal(false);
  importResult = signal<ImportProductsResult | null>(null);
  showImportResult = signal(false);

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

    const storeId = this.storeContext.currentStoreId() || '';
    const isActive = product.status === 'Active';
    const action$ = isActive
      ? this.productService.deactivateProduct(storeId, productId)
      : this.productService.activateProduct(storeId, productId);

    action$.subscribe({
      next: () => {
        const newStatus = isActive ? 'Inactive' : 'Active';
        this.products.update(products =>
          products.map(p => p.id === productId ? { ...p, status: newStatus } : p)
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

  /** Handle a selected CSV file: upload, refresh lists, and surface the results. */
  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      alert('Please select a store first');
      input.value = '';
      return;
    }

    this.importing.set(true);
    this.importResult.set(null);

    this.productService.importProducts(storeId, file).subscribe({
      next: (result) => {
        this.importing.set(false);
        this.importResult.set(result);
        this.showImportResult.set(true);
        input.value = '';
        this.currentPage.set(1);
        this.loadCategories();
        this.loadProducts();
      },
      error: (err) => {
        this.importing.set(false);
        input.value = '';
        alert(err?.error?.message || 'Import failed. Please check the file format.');
      }
    });
  }

  dismissImportResult(): void {
    this.showImportResult.set(false);
    this.importResult.set(null);
  }

  /** Download a ready-to-fill CSV template (UTF-8 BOM so Excel renders Arabic correctly). */
  downloadImportTemplate(): void {
    const header = 'name_en,name_ar,category_en,category_ar,price,compare_at,sku,quantity,status';
    const sample = 'Blue Shirt,قميص أزرق,Shirts,قمصان,120,150,SH-01,25,Active';
    const csv = '﻿' + header + '\n' + sample + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
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
