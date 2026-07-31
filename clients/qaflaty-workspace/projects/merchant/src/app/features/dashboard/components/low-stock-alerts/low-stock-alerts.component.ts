import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { DashboardService, LowStockItem } from '../../services/dashboard.service';
import { StoreContextService } from '../../../../core/services/store-context.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './low-stock-alerts.component.html',
  styleUrl: './low-stock-alerts.component.scss',
})
export class LowStockAlertsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private storeContext = inject(StoreContextService);

  loading = signal(true);
  items = signal<LowStockItem[]>([]);
  // An empty list and a failed request look identical once loading stops, and the empty state here
  // reads "all products are well stocked" — so a failure has to be tracked separately rather than
  // reassuring the merchant about stock nobody managed to check.
  failed = signal(false);

  ngOnInit(): void {
    this.loadLowStockItems();
  }

  loadLowStockItems(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.failed.set(false);

    this.dashboardService.getLowStockItems(storeId).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load low stock items:', err);
        this.items.set([]);
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  formatAttributes(attributes: Record<string, string>): string {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
}
