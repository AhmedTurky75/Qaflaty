import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StoreService } from '../stores/services/store.service';
import { DashboardService, DashboardStats, SalesChartData, TopProduct, RecentOrderSummary } from './services/dashboard.service';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { SalesChartComponent } from './components/sales-chart/sales-chart.component';
import { RecentOrdersComponent } from './components/recent-orders/recent-orders.component';
import { TopProductsComponent } from './components/top-products/top-products.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatsCardComponent,
    SalesChartComponent,
    RecentOrdersComponent,
    TopProductsComponent,
    QuickActionsComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private storeService = inject(StoreService);
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  error = signal<string | null>(null);
  selectedStore = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);
  salesData = signal<SalesChartData[]>([]);
  recentOrders = signal<RecentOrderSummary[]>([]);
  topProducts = signal<TopProduct[]>([]);
  chartPeriod = signal<7 | 30>(7);

  ngOnInit(): void {
    this.loadStoreAndDashboard();
  }

  private loadStoreAndDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    // First, get the merchant's stores
    this.storeService.getMyStores().subscribe({
      next: (stores) => {
        if (stores && stores.length > 0) {
          // Use the first store by default
          const storeId = stores[0].id;
          this.selectedStore.set(storeId);
          this.loadDashboardData(storeId);
        } else {
          this.loading.set(false);
          this.selectedStore.set(null);
        }
      },
      error: (err) => {
        console.error('Failed to load stores:', err);
        this.error.set('Failed to load stores. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private loadDashboardData(storeId: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Load all dashboard data in parallel
    forkJoin({
      stats: this.dashboardService.getDashboardStats(storeId),
      salesData: this.dashboardService.getSalesChartData(storeId, this.chartPeriod()),
      recentOrders: this.dashboardService.getRecentOrders(storeId, 10),
      topProducts: this.dashboardService.getTopProducts(storeId, 5)
    }).subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.salesData.set(data.salesData);
        this.recentOrders.set(data.recentOrders);
        this.topProducts.set(data.topProducts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onChartPeriodChange(period: 7 | 30): void {
    if (!this.selectedStore()) return;

    this.chartPeriod.set(period);
    this.dashboardService.getSalesChartData(this.selectedStore()!, period).subscribe({
      next: (data) => {
        this.salesData.set(data);
      },
      error: (err) => {
        console.error('Failed to load sales chart data:', err);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
