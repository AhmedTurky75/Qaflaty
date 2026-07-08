import { Component, input, computed, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { Product } from '../../../models/product.model';
import { CartService } from '../../../services/cart.service';
import { I18nService } from '../../../services/i18n.service';
import { StorePricePipe } from '../../../pipes/store-price.pipe';

interface Tier {
  qty: number;
  label: string;
  badge: string;
  highlight: boolean;
  subtotal: number;
}

/**
 * Quantity offer tiers ("Buy 1 / Buy 2 / Buy 3") for a product-landing page.
 * Content model:
 *   { title:{en,ar}, tiers:[{ qty, label:{en,ar}, badge:{en,ar}, highlight }] }
 * Each tier adds its quantity to the cart. Pricing shown is the honest
 * subtotal (qty × unit price); the merchant-entered badge is marketing copy —
 * real per-bundle discounts still need a promo/pricing rule server-side.
 */
@Component({
  selector: 'app-bundle-tiers',
  standalone: true,
  imports: [StorePricePipe],
  template: `
    @if (product(); as prod) {
      <div class="max-w-2xl mx-auto px-4 py-10">
        @if (title()) {
          <h2 class="text-xl md:text-2xl font-bold text-gray-900 text-center mb-6">{{ title() }}</h2>
        }
        <div class="space-y-3">
          @for (tier of tiers(); track $index) {
            <button type="button" (click)="add(tier.qty)"
              class="w-full flex items-center gap-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 px-4 py-3 text-start transition-colors"
              [style.border-color]="tier.highlight ? 'var(--primary-color)' : null">
              <div class="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--primary-color)] text-white font-bold flex-shrink-0">
                ×{{ tier.qty }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900">{{ tier.label }}</p>
                @if (tier.badge) {
                  <span class="inline-block mt-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">{{ tier.badge }}</span>
                }
              </div>
              <div class="text-end flex-shrink-0">
                <p class="font-bold text-[var(--primary-color)]">{{ tier.subtotal | storePrice }}</p>
                <p class="text-[11px] text-gray-400">{{ (tier.subtotal / tier.qty) | storePrice }} each</p>
              </div>
            </button>
          }
        </div>
      </div>
    }
  `
})
export class BundleTiersComponent {
  config = input.required<SectionConfigurationDto>();
  product = input<Product | null>(null);

  private cart = inject(CartService);
  private i18n = inject(I18nService);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  private tr(field: any): string {
    return (this.i18n.currentLanguage() === 'ar' ? field?.ar : field?.en) || '';
  }

  title = computed(() => this.tr(this.content().title));

  tiers = computed<Tier[]>(() => {
    const price = this.product()?.price ?? 0;
    const raw: any[] = Array.isArray(this.content().tiers) ? this.content().tiers : [];
    return raw
      .filter(t => Number(t.qty) > 0)
      .map(t => {
        const qty = Number(t.qty);
        return {
          qty,
          label: this.tr(t.label) || `Buy ${qty}`,
          badge: this.tr(t.badge),
          highlight: t.highlight === true,
          subtotal: price * qty
        };
      });
  });

  add(qty: number): void {
    const p = this.product();
    if (!p || (p.hasVariants ?? false)) {
      document.getElementById('buy-box')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    this.cart.addItem(p, qty);
    window.dispatchEvent(new CustomEvent('toggle-cart'));
  }
}
