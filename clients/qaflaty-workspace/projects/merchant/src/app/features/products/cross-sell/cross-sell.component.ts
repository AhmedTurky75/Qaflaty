import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductDto } from 'shared';
import { StoreContextService } from '../../../core/services/store-context.service';
import { ProductService } from '../services/product.service';
import { CrossSellService, CrossSellSettings } from '../services/cross-sell.service';

@Component({
  selector: 'app-cross-sell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cross-sell.component.html',
  styleUrls: ['./cross-sell.component.scss']
})
export class CrossSellComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storeContext = inject(StoreContextService);
  private productService = inject(ProductService);
  private crossSellService = inject(CrossSellService);

  productId = signal<string>('');
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
      crossSell: this.crossSellService.getCrossSell(storeId, id),
      settings: this.crossSellService.getSettings(storeId)
    }).subscribe({
      next: ({ products, crossSell, settings }) => {
        this.allProducts.set(products.items);
        this.selectedIds.set(new Set(crossSell.map(p => p.id)));
        this.settingsEnabled.set(settings.enabled);
        this.settingsLimit.set(settings.limit);
        this.settingsExcludeOutOfStock.set(settings.excludeOutOfStock);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
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

    const settings: CrossSellSettings = {
      enabled: this.settingsEnabled(),
      limit: this.settingsLimit(),
      excludeOutOfStock: this.settingsExcludeOutOfStock()
    };

    forkJoin([
      this.crossSellService.setSettings(storeId, settings),
      this.crossSellService.setCrossSell(storeId, id, Array.from(this.selectedIds()))
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
