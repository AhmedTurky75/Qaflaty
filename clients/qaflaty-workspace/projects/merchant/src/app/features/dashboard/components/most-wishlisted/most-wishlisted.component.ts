import { Component, inject, signal, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { StoreContextService } from '../../../../core/services/store-context.service';
import { WishlistAnalyticsService, MostWishlistedProduct } from '../../services/wishlist-analytics.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-most-wishlisted',
  standalone: true,
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './most-wishlisted.component.html',
  styleUrl: './most-wishlisted.component.scss',
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
