import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { SectionConfigurationDto } from 'shared';
import { Product, ProductVariant } from '../../../models/product.model';
import { CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service';
import { I18nService } from '../../../services/i18n.service';
import { StorePricePipe } from '../../../pipes/store-price.pipe';

/**
 * Movable inline "buy box". Content model:
 *   { productSlug, heading:{en,ar}, buttonText:{en,ar}, showImage, showQuantity }
 * Uses the page's product when there is one (product-landing pages); otherwise
 * loads the product named by `productSlug`, so it also works on the home page
 * and custom pages. Collects variant + quantity and adds to cart / buys now via
 * the existing checkout flow.
 */
@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [StorePricePipe],
  template: `
    @if (effectiveProduct(); as prod) {
      <div class="max-w-2xl mx-auto px-4 py-8">
        <div class="rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 bg-white">
          @if (heading()) {
            <h2 class="text-lg font-bold text-gray-900 mb-4">{{ heading() }}</h2>
          }
          <div class="flex gap-4">
            @if (showImage() && prod.images?.[0]) {
              <img [src]="prod.images[0].url" [alt]="name()" class="w-20 h-20 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
            }
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900">{{ name() }}</p>
              <div class="mt-1 flex items-center gap-2">
                <span class="text-xl font-bold text-[var(--primary-color)]">{{ unitPrice() | storePrice }}</span>
                @if (prod.compareAtPrice && prod.compareAtPrice > unitPrice()) {
                  <span class="text-sm text-gray-400 line-through">{{ prod.compareAtPrice | storePrice }}</span>
                }
              </div>
            </div>
          </div>

          @if (variants().length) {
            <div class="mt-4">
              <label class="block text-xs font-medium text-gray-600 mb-1">Choose an option</label>
              <select (change)="onVariant($event)" class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="">Select…</option>
                @for (v of variants(); track v.id) {
                  <option [value]="v.id">{{ variantLabel(v) }}</option>
                }
              </select>
            </div>
          }

          <div class="mt-4 flex items-center gap-3">
            @if (showQuantity()) {
              <div class="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button type="button" (click)="dec()" class="px-3 py-2 text-gray-600 hover:bg-gray-50">−</button>
                <span class="px-3 text-sm tabular-nums w-8 text-center">{{ quantity() }}</span>
                <button type="button" (click)="inc()" class="px-3 py-2 text-gray-600 hover:bg-gray-50">+</button>
              </div>
            }
            <button type="button" (click)="buyNow()" [disabled]="!canBuy()"
              class="flex-1 px-5 py-3 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {{ buttonText() }}
            </button>
          </div>
          <button type="button" (click)="addToCart()" [disabled]="!canBuy()"
            class="mt-2 w-full px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {{ addToCartText() }}
          </button>
          @if (needsVariant()) {
            <p class="mt-2 text-xs text-amber-600 text-center">Please choose an option first.</p>
          }
        </div>
      </div>
    }
  `
})
export class OrderFormComponent {
  config = input.required<SectionConfigurationDto>();
  product = input<Product | null>(null);

  private cart = inject(CartService);
  private router = inject(Router);
  private i18n = inject(I18nService);
  private productService = inject(ProductService);

  quantity = signal(1);
  selectedVariant = signal<ProductVariant | null>(null);
  private fetched = signal<Product | null>(null);
  private lastSlug = '';

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  private productSlug = computed(() => (this.content().productSlug || '').trim());
  /** Page product if present, else the product referenced by `productSlug`. */
  effectiveProduct = computed(() => this.product() ?? this.fetched());

  constructor() {
    effect(() => {
      const slug = this.productSlug();
      if (this.product() || !slug || slug === this.lastSlug) return;
      this.lastSlug = slug;
      this.productService.getProductBySlug(slug).subscribe({
        next: (p) => this.fetched.set(p),
        error: () => this.fetched.set(null)
      });
    });
  }

  private tr(field: any, fallback = ''): string {
    return (this.i18n.currentLanguage() === 'ar' ? field?.ar : field?.en) || fallback;
  }

  heading = computed(() => this.tr(this.content().heading));
  buttonText = computed(() => this.tr(this.content().buttonText, this.i18n.currentLanguage() === 'ar' ? 'اطلب الآن' : 'Buy Now'));
  addToCartText = computed(() => this.i18n.currentLanguage() === 'ar' ? 'أضف إلى السلة' : 'Add to cart');
  showImage = computed(() => this.content().showImage !== false);
  showQuantity = computed(() => this.content().showQuantity !== false);

  name = computed(() => {
    const p = this.effectiveProduct();
    return p ? this.i18n.nameFor(p.name, p.nameAr) : '';
  });

  variants = computed<ProductVariant[]>(() => this.effectiveProduct()?.variants ?? []);

  unitPrice = computed(() => {
    const p = this.effectiveProduct();
    if (!p) return 0;
    const v = this.selectedVariant();
    return v?.priceOverride?.amount ?? p.price;
  });

  needsVariant = computed(() => (this.effectiveProduct()?.hasVariants ?? false) && !this.selectedVariant());
  canBuy = computed(() => !!this.effectiveProduct() && !this.needsVariant());

  variantLabel(v: ProductVariant): string {
    if (v.attributes && Object.keys(v.attributes).length) return Object.values(v.attributes).join(' / ');
    return v.sku || 'Option';
  }

  onVariant(e: Event): void {
    const id = (e.target as HTMLSelectElement).value;
    this.selectedVariant.set(this.variants().find(v => v.id === id) ?? null);
    this.quantity.set(1);
  }

  inc(): void { this.quantity.update(q => q + 1); }
  dec(): void { this.quantity.update(q => Math.max(1, q - 1)); }

  addToCart(): void {
    const p = this.effectiveProduct();
    if (!p || this.needsVariant()) return;
    this.cart.addItem(p, this.quantity(), this.selectedVariant() ?? undefined);
    window.dispatchEvent(new CustomEvent('toggle-cart'));
  }

  buyNow(): void {
    const p = this.effectiveProduct();
    if (!p || this.needsVariant()) return;
    this.cart.addItem(p, this.quantity(), this.selectedVariant() ?? undefined);
    this.router.navigate(['/checkout']);
  }
}
