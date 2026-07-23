import { Component, Input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { OrderService, OrderStats } from '../../services/order.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { OrderStatus } from 'shared';

@Component({
  selector: 'app-order-statistics',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, IconComponent],
  templateUrl: './order-statistics.component.html',
  styleUrls: ['./order-statistics.component.scss']
})
export class OrderStatisticsComponent implements OnInit {
  @Input({ required: true }) storeId!: string;

  private orderService = inject(OrderService);

  stats = signal<OrderStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  OrderStatus = OrderStatus;

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    if (!this.storeId) {
      this.error.set('Store ID is required');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.orderService.getOrderStats(this.storeId).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load statistics');
        this.loading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  statusKey(status: OrderStatus): string {
    return `orders.status.${status}`;
  }

  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending:
        return 'text-warning bg-warning/10';
      case OrderStatus.Confirmed:
      case OrderStatus.Processing:
      case OrderStatus.Shipped:
        return 'text-primary bg-primary-tint';
      case OrderStatus.Delivered:
        return 'text-success bg-success/10';
      case OrderStatus.Cancelled:
        return 'text-danger bg-danger/10';
      default:
        return 'text-text-muted bg-surface-elevated';
    }
  }
}
