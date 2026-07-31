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

  ngOnInit(): void {
    this.loadLowStockItems();
  }

  loadLowStockItems(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loading.set(false);
      return;
    }

    this.dashboardService.getLowStockItems(storeId).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load low stock items:', err);
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
