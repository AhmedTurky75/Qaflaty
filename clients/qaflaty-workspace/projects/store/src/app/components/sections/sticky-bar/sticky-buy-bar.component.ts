import { Component, input, computed, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { Product } from '../../../models/product.model';
import { CartService } from '../../../services/cart.service';
import { I18nService } from '../../../services/i18n.service';
import { StorePricePipe } from '../../../pipes/store-price.pipe';

/**
 * Sticky mobile buy-bar pinned to the bottom of the viewport (mobile only).
 * Content model: { buttonText:{en,ar} }. Product-aware; adds to cart and opens
 * the cart. Landing pages already reserve bottom padding for it.
 */
@Component({
  selector: 'app-sticky-buy-bar',
  standalone: true,
  imports: [StorePricePipe],
  template: `
    @if (product(); as prod) {
      <div class="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-3">
        <div class="min-w-0">
          <p class="text-xs text-gray-500 truncate">{{ name() }}</p>
          <p class="text-base font-bold text-[var(--primary-color)] leading-tight">{{ prod.price | storePrice }}</p>
        </div>
        <button type="button" (click)="add()"
          class="ms-auto px-6 py-2.5 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
          {{ buttonText() }}
        </button>
      </div>
    }
  `
})
export class StickyBuyBarComponent {
  config = input.required<SectionConfigurationDto>();
  product = input<Product | null>(null);

  private cart = inject(CartService);
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  name = computed(() => {
    const p = this.product();
    return p ? this.i18n.nameFor(p.name, p.nameAr) : '';
  });

  buttonText = computed(() => {
    const c = this.content();
    const ar = this.i18n.currentLanguage() === 'ar';
    return (ar ? c.buttonText?.ar : c.buttonText?.en) || (ar ? 'اطلب الآن' : 'Buy Now');
  });

  add(): void {
    const p = this.product();
    if (!p || (p.hasVariants ?? false)) {
      // With variants, send them to the buy box to choose an option.
      document.getElementById('buy-box')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    this.cart.addItem(p, 1);
    window.dispatchEvent(new CustomEvent('toggle-cart'));
  }
}
