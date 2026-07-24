import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActiveCartsService, ActiveCart, ActiveCartItem } from './services/active-carts.service';
import { AnalyticsRealtimeService } from '../../core/services/analytics-realtime.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-active-carts',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './active-carts.component.html',
  styleUrl: './active-carts.component.scss',
})
export class ActiveCartsComponent implements OnInit {
  private activeCartsService = inject(ActiveCartsService);
  private analyticsRealtime = inject(AnalyticsRealtimeService);

  carts = signal<ActiveCart[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  totalItems = computed(() => this.carts().reduce((sum, c) => sum + c.totalItems, 0));
  estimatedRevenue = computed(() =>
    this.carts().reduce((sum, c) => sum + this.cartTotal(c), 0)
  );

  private firstCartsChangedTick = true;

  constructor() {
    effect(() => {
      this.analyticsRealtime.cartsChangedTick();
      if (this.firstCartsChangedTick) {
        this.firstCartsChangedTick = false;
        return;
      }
      this.loadCarts();
    });
  }

  ngOnInit(): void {
    this.loadCarts();
  }

  loadCarts(): void {
    const storeId = localStorage.getItem('currentStoreId') || '';
    if (!storeId) {
      this.error.set('Please select a store first.');
      this.loading.set(false);
      return;
    }

    this.analyticsRealtime.connectToStore(storeId);

    this.loading.set(true);
    this.error.set(null);

    this.activeCartsService.getActiveCarts(storeId).subscribe({
      next: (carts) => {
        this.carts.set(carts);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load active carts.');
        this.loading.set(false);
      }
    });
  }

  cartTotal(cart: ActiveCart): number {
    return cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
}
