import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StoreContextService } from '../../core/services/store-context.service';
import { DashboardService, DashboardStats, SalesChartData, TopProduct, RecentOrderSummary } from './services/dashboard.service';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { SalesChartComponent } from './components/sales-chart/sales-chart.component';
import { RecentOrdersComponent } from './components/recent-orders/recent-orders.component';
import { TopProductsComponent } from './components/top-products/top-products.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { LowStockAlertsComponent } from './components/low-stock-alerts/low-stock-alerts.component';

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
    QuickActionsComponent,
    LowStockAlertsComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private storeContext = inject(StoreContextService);
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  error = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);
  salesData = signal<SalesChartData[]>([]);
  recentOrders = signal<RecentOrderSummary[]>([]);
  topProducts = signal<TopProduct[]>([]);
  chartPeriod = signal<7 | 30>(7);

  selectedStore = this.storeContext.currentStoreId;

  constructor() {
    effect(() => {
      const storeId = this.storeContext.currentStoreId();
      if (storeId) {
        this.loadDashboardData(storeId);
      } else {
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
      //Question : Why we don't have api for salesData? should we add it?
      //salesData: this.dashboardService.getSalesChartData(storeId, this.chartPeriod()),
      recentOrders: this.dashboardService.getRecentOrders(storeId, 10),
      //Questrion : Why we don't have api for topProducts? should we add it?
      //topProducts: this.dashboardService.getTopProducts(storeId, 5)
    }).subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        //this.salesData.set(data.salesData);
        this.recentOrders.set(data.recentOrders);
        //this.topProducts.set(data.topProducts);
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
