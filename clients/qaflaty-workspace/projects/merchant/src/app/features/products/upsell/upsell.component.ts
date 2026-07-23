import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductDto } from 'shared';
import { StoreContextService } from '../../../core/services/store-context.service';
import { ProductService } from '../services/product.service';
import { UpSellService, UpSellSettings } from '../services/upsell.service';

@Component({
  selector: 'app-upsell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './upsell.component.html',
  styleUrls: ['./upsell.component.scss']
})
export class UpSellComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storeContext = inject(StoreContextService);
  private productService = inject(ProductService);
  private upSellService = inject(UpSellService);

  productId = signal<string>('');
  sourcePrice = signal<number>(0);
  loading = signal(true);
  saving = signal(false);
  saved = signal(false);

  settingsEnabled = signal(true);
  settingsLimit = signal(4);
  settingsExcludeOutOfStock = signal(true);

  allProducts = signal<ProductDto[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  search = signal('');

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
      upSell: this.upSellService.getUpSell(storeId, id),
      settings: this.upSellService.getSettings(storeId),
      source: this.productService.getProductById(storeId, id)
    }).subscribe({
      next: ({ products, upSell, settings, source }) => {
        this.allProducts.set(products.items);
        this.selectedIds.set(new Set(upSell.map(p => p.id)));
        this.settingsEnabled.set(settings.enabled);
        this.settingsLimit.set(settings.limit);
        this.settingsExcludeOutOfStock.set(settings.excludeOutOfStock);
        this.sourcePrice.set(source?.price ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  /** True when a candidate is priced at or below the source product — not a genuine upgrade. */
  isNotAGenuineUpgrade(p: ProductDto): boolean {
    return p.price <= this.sourcePrice();
  }

  toggle(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selectedIds.set(next);
  }

  imageUrl(p: ProductDto): string | null {
    return p.firstImageUrl || p.images?.[0]?.url || null;
  }

  save(): void {
    const storeId = this.storeId;
    const id = this.productId();
    if (!storeId || !id) return;

    this.saving.set(true);
    this.saved.set(false);

    const settings: UpSellSettings = {
      enabled: this.settingsEnabled(),
      limit: this.settingsLimit(),
      excludeOutOfStock: this.settingsExcludeOutOfStock()
    };

    forkJoin([
      this.upSellService.setSettings(storeId, settings),
      this.upSellService.setUpSell(storeId, id, Array.from(this.selectedIds()))
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
