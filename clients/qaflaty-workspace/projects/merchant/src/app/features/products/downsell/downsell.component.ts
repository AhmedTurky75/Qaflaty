import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductDto } from 'shared';
import { StoreContextService } from '../../../core/services/store-context.service';
import { ProductService } from '../services/product.service';
import { DownsellService, DownsellSettings, DownsellTriggerRule, DownsellTriggerType } from '../services/downsell.service';
import { PromoCodeService, PromoCodeDto } from '../../promo-codes/services/promo-code.service';

const DEFAULT_RULES: DownsellTriggerRule[] = [
  { triggerType: 'ExitIntentPdp', surface: 'ProductDetails', thresholdSeconds: null, isEnabled: false, priority: 0 },
  { triggerType: 'DwellTimePdp', surface: 'ProductDetails', thresholdSeconds: 30, isEnabled: false, priority: 1 },
  { triggerType: 'CartItemRemoved', surface: 'Cart', thresholdSeconds: null, isEnabled: false, priority: 2 },
  { triggerType: 'CartInactivity', surface: 'Cart', thresholdSeconds: 60, isEnabled: false, priority: 3 }
];

const TRIGGER_LABELS: Record<DownsellTriggerType, string> = {
  ExitIntentPdp: 'Exit intent on product page (desktop)',
  DwellTimePdp: 'Stayed on product page without adding to cart',
  CartItemRemoved: 'Removed a product from the cart',
  CartInactivity: 'Inactive on the cart page'
};

@Component({
  selector: 'app-downsell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './downsell.component.html',
  styleUrls: ['./downsell.component.scss']
})
export class DownsellComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storeContext = inject(StoreContextService);
  private productService = inject(ProductService);
  private downsellService = inject(DownsellService);
  private promoCodeService = inject(PromoCodeService);

  productId = signal<string>('');
  sourcePrice = signal<number>(0);
  loading = signal(true);
  saving = signal(false);
  saved = signal(false);

  settingsEnabled = signal(true);
  settingsMaxShows = signal(2);
  settingsMinInterval = signal(300);
  settingsExcludeOutOfStock = signal(true);
  rules = signal<DownsellTriggerRule[]>(DEFAULT_RULES);

  allProducts = signal<ProductDto[]>([]);
  promoCodes = signal<PromoCodeDto[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  selectedPromoCodeId = signal<string>('');
  offerEnabled = signal(true);
  search = signal('');

  readonly triggerTypes: DownsellTriggerType[] =
    ['ExitIntentPdp', 'DwellTimePdp', 'CartItemRemoved', 'CartInactivity'];

  triggerLabel = (t: DownsellTriggerType) => TRIGGER_LABELS[t];

  private get storeId(): string | null {
    return this.storeContext.currentStoreId();
  }

  filtered = computed(() => {
    const term = this.search().toLowerCase().trim();
    const pid = this.productId();
    return this.allProducts()
      .filter(p => p.id !== pid)
      .filter(p => !term || p.name.toLowerCase().includes(term));
  });

  selectedCount = computed(() => this.selectedIds().size);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.productId.set(id);

    const storeId = this.storeId;
    if (!storeId || !id) { this.loading.set(false); return; }

    forkJoin({
      products: this.productService.getProducts(storeId, { limit: 200 }),
      offer: this.downsellService.getOffer(storeId, id),
      settings: this.downsellService.getSettings(storeId),
      rules: this.downsellService.getTriggerRules(storeId),
      promoCodes: this.promoCodeService.getAll(storeId),
      source: this.productService.getProductById(storeId, id)
    }).subscribe({
      next: ({ products, offer, settings, rules, promoCodes, source }) => {
        this.allProducts.set(products.items);
        this.selectedIds.set(new Set(offer.downsellProducts.map(p => p.id)));
        this.selectedPromoCodeId.set(offer.promoCodeId ?? '');
        this.offerEnabled.set(offer.isEnabled);
        this.settingsEnabled.set(settings.enabled);
        this.settingsMaxShows.set(settings.maxShowsPerSession);
        this.settingsMinInterval.set(settings.minIntervalSeconds);
        this.settingsExcludeOutOfStock.set(settings.excludeOutOfStock);
        this.rules.set(rules.length > 0 ? rules : DEFAULT_RULES);
        this.promoCodes.set(promoCodes.filter(p => p.isActive));
        this.sourcePrice.set(source?.price ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  /** True when a candidate is priced at or above the source product — not a genuine downgrade. */
  isNotAGenuineDowngrade(p: ProductDto): boolean {
    return p.price >= this.sourcePrice();
  }

  toggle(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selectedIds.set(next);
  }

  imageUrl(p: ProductDto): string | null {
    return p.firstImageUrl || p.images?.[0]?.url || null;
  }

  updateRule(triggerType: DownsellTriggerType, patch: Partial<DownsellTriggerRule>): void {
    this.rules.set(this.rules().map(r => r.triggerType === triggerType ? { ...r, ...patch } : r));
  }

  ruleFor(triggerType: DownsellTriggerType): DownsellTriggerRule {
    return this.rules().find(r => r.triggerType === triggerType) ?? DEFAULT_RULES.find(r => r.triggerType === triggerType)!;
  }

  save(): void {
    const storeId = this.storeId;
    const id = this.productId();
    if (!storeId || !id) return;

    this.saving.set(true);
    this.saved.set(false);

    const settings: DownsellSettings = {
      enabled: this.settingsEnabled(),
      maxShowsPerSession: this.settingsMaxShows(),
      minIntervalSeconds: this.settingsMinInterval(),
      excludeOutOfStock: this.settingsExcludeOutOfStock()
    };

    forkJoin([
      this.downsellService.setSettings(storeId, settings),
      this.downsellService.setTriggerRules(storeId, this.rules()),
      this.downsellService.setOffer(
        storeId, id, Array.from(this.selectedIds()),
        this.selectedPromoCodeId() || null, this.offerEnabled())
    ]).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2500);
      },
      error: () => this.saving.set(false)
    });
  }
}
