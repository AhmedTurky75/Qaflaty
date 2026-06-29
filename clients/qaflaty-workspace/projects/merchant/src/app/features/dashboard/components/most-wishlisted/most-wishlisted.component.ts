import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreContextService } from '../../../../core/services/store-context.service';
import { WishlistAnalyticsService, MostWishlistedProduct } from '../../services/wishlist-analytics.service';

@Component({
  selector: 'app-most-wishlisted',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">❤️ Most Wishlisted</h3>

      @if (loading()) {
        <p class="text-gray-400 text-sm">Loading…</p>
      } @else if (items().length === 0) {
        <p class="text-gray-400 text-sm">No wishlist data yet.</p>
      } @else {
        <ul class="divide-y divide-gray-100">
          @for (p of items(); track p.productId; let i = $index) {
            <li class="flex items-center gap-3 py-2.5">
              <span class="w-5 text-gray-400 font-semibold text-sm">{{ i + 1 }}</span>
              <div class="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                @if (p.imageUrl) { <img [src]="p.imageUrl" [alt]="p.productName" class="w-full h-full object-cover" /> }
                @else { <span class="text-gray-300">📦</span> }
              </div>
              <span class="flex-1 min-w-0 truncate text-sm font-medium text-gray-800">{{ p.productName }}</span>
              <span class="text-sm font-semibold text-gray-900">{{ p.wishlistCount }}</span>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class MostWishlistedComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private analytics = inject(WishlistAnalyticsService);

  items = signal<MostWishlistedProduct[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) { this.loading.set(false); return; }

    this.analytics.getMostWishlisted(storeId, 5).subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
