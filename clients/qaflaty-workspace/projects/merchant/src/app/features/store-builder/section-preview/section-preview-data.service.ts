import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CategoryDto, ProductDto } from 'shared';
import { ProductService } from '../../products/services/product.service';
import { CategoryService } from '../../products/services/category.service';
import { StoreContextService } from '../../../core/services/store-context.service';

/** Trimmed product shape the miniatures render — real store data, no extras. */
export interface PreviewProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
}

export interface PreviewCategory {
  id: string;
  name: string;
  imageUrl?: string;
}

/** Used when the store has nothing to show yet, so a card is never blank. */
const DEMO_PRODUCTS: PreviewProduct[] = [
  { id: 'demo-1', name: 'Classic cotton tee', price: 249, compareAtPrice: 349 },
  { id: 'demo-2', name: 'Everyday backpack', price: 780 },
  { id: 'demo-3', name: 'Leather card holder', price: 320, compareAtPrice: 400 },
  { id: 'demo-4', name: 'Ceramic mug set', price: 190 },
  { id: 'demo-5', name: 'Linen shirt', price: 560 },
  { id: 'demo-6', name: 'Running socks (3 pack)', price: 130, compareAtPrice: 160 },
  { id: 'demo-7', name: 'Desk lamp', price: 640 },
  { id: 'demo-8', name: 'Canvas tote', price: 210 }
];

const DEMO_CATEGORIES: PreviewCategory[] = [
  { id: 'demo-c1', name: 'New arrivals' },
  { id: 'demo-c2', name: 'Clothing' },
  { id: 'demo-c3', name: 'Accessories' },
  { id: 'demo-c4', name: 'Home' },
  { id: 'demo-c5', name: 'Bags' },
  { id: 'demo-c6', name: 'Offers' }
];

/**
 * Loads one bounded slice of the store's catalogue for the whole builder
 * session and shares it with every preview surface — the library cards and the
 * canvas blocks all read these signals, so the panel makes exactly two requests
 * no matter how many section cards are on screen.
 */
@Injectable({ providedIn: 'root' })
export class SectionPreviewDataService {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private storeContext = inject(StoreContextService);

  private static readonly PRODUCT_LIMIT = 12;
  private static readonly CATEGORY_LIMIT = 8;

  private readonly realProducts = signal<PreviewProduct[]>([]);
  private readonly realCategories = signal<PreviewCategory[]>([]);
  private loadedStoreId: string | null = null;

  readonly loading = signal(false);
  readonly loaded = signal(false);

  /** True when previews fall back to the built-in demo catalogue. */
  readonly usingSampleProducts = computed(() => this.realProducts().length === 0);
  readonly usingSampleCategories = computed(() => this.realCategories().length === 0);
  readonly usingSampleData = computed(() => this.usingSampleProducts() || this.usingSampleCategories());

  readonly products = computed<PreviewProduct[]>(() =>
    this.realProducts().length ? this.realProducts() : DEMO_PRODUCTS);

  readonly categories = computed<PreviewCategory[]>(() =>
    this.realCategories().length ? this.realCategories() : DEMO_CATEGORIES);

  readonly currencySymbol = computed(() =>
    this.storeContext.currentStore()?.currencySymbol || '');

  readonly primaryColor = computed(() =>
    this.storeContext.currentStore()?.branding?.primaryColor || '#2563eb');

  /** Idempotent: repeated calls for the same store are ignored. */
  load(storeId: string | null | undefined): void {
    if (!storeId || this.loading()) return;
    if (this.loadedStoreId === storeId && this.loaded()) return;

    this.loading.set(true);
    this.loadedStoreId = storeId;

    forkJoin({
      products: this.productService
        .getProducts(storeId, { limit: SectionPreviewDataService.PRODUCT_LIMIT })
        .pipe(catchError(() => of(null))),
      categories: this.categoryService
        .getCategories(storeId)
        .pipe(catchError(() => of(null)))
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ products, categories }) => {
        this.realProducts.set(this.toPreviewProducts(products?.items ?? []));
        this.realCategories.set(this.toPreviewCategories(categories ?? []));
        this.loaded.set(true);
      });
  }

  private toPreviewProducts(items: ProductDto[]): PreviewProduct[] {
    return items.slice(0, SectionPreviewDataService.PRODUCT_LIMIT).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      imageUrl: p.firstImageUrl || p.images?.[0]?.url
    }));
  }

  private toPreviewCategories(items: CategoryDto[]): PreviewCategory[] {
    return items.slice(0, SectionPreviewDataService.CATEGORY_LIMIT).map(c => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl ?? undefined
    }));
  }
}
