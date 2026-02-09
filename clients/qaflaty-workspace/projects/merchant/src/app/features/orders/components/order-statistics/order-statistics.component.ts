import { Component, Input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, OrderStats } from '../../services/order.service';
import { OrderStatus } from 'shared';

@Component({
  selector: 'app-order-statistics',
  standalone: true,
  imports: [CommonModule],
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

  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending:
        return 'text-yellow-600 bg-yellow-50';
      case OrderStatus.Confirmed:
        return 'text-blue-600 bg-blue-50';
      case OrderStatus.Processing:
        return 'text-purple-600 bg-purple-50';
      case OrderStatus.Shipped:
        return 'text-indigo-600 bg-indigo-50';
      case OrderStatus.Delivered:
        return 'text-green-600 bg-green-50';
      case OrderStatus.Cancelled:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }
}
