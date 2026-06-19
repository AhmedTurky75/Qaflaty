import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductDto } from 'shared';
import { StoreContextService } from '../../../core/services/store-context.service';
import { ProductService } from '../services/product.service';
import { RelatedProductsService } from '../services/related-products.service';

@Component({
  selector: 'app-related-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './related-products.component.html',
  styleUrls: ['./related-products.component.scss']
})
export class RelatedProductsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storeContext = inject(StoreContextService);
  private productService = inject(ProductService);
  private relatedService = inject(RelatedProductsService);

  productId = signal<string>('');
  loading = signal(true);
  saving = signal(false);
  saved = signal(false);

  manualMode = signal(false);
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
      related: this.relatedService.getManualRelated(storeId, id)
    }).subscribe({
      next: ({ products, related }) => {
        this.allProducts.set(products.items);
        this.manualMode.set(related.manual);
        this.selectedIds.set(new Set(related.selected.map(p => p.id)));
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

    forkJoin([
      this.relatedService.setMode(storeId, this.manualMode()),
      this.relatedService.setManualRelated(storeId, id, Array.from(this.selectedIds()))
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
