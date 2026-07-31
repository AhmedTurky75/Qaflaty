import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { OrderStatusChange, OrderStatus } from 'shared';

@Component({
  selector: 'app-order-timeline',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './order-timeline.component.html',
  styleUrls: ['./order-timeline.component.scss']
})
export class OrderTimelineComponent {
  @Input({ required: true }) statusHistory: OrderStatusChange[] = [];

  /** i18n key for a status label. */
  statusKey(status: OrderStatus): string {
    return `orders.status.${status}`;
  }

  /** Token-based dot colour for a status. */
  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending:
        return 'bg-warning';
      case OrderStatus.Confirmed:
      case OrderStatus.Processing:
      case OrderStatus.Shipped:
        return 'bg-primary';
      case OrderStatus.Delivered:
        return 'bg-success';
      case OrderStatus.Cancelled:
        return 'bg-danger';
      default:
        return 'bg-text-muted';
    }
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending:
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case OrderStatus.Confirmed:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case OrderStatus.Processing:
        return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
      case OrderStatus.Shipped:
        return 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4';
      case OrderStatus.Delivered:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case OrderStatus.Cancelled:
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
