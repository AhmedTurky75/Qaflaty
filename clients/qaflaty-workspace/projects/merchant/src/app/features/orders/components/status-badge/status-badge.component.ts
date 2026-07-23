import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { OrderStatus } from 'shared';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: OrderStatus;

  /** i18n key for the status label. */
  get statusKey(): string {
    return `orders.status.${this.status}`;
  }

  /** Token-based chip classes (themeable, AA-safe). */
  get badgeClasses(): string {
    switch (this.status) {
      case OrderStatus.Pending:
        return 'bg-warning/10 text-warning';
      case OrderStatus.Confirmed:
      case OrderStatus.Processing:
      case OrderStatus.Shipped:
        return 'bg-primary-tint text-primary';
      case OrderStatus.Delivered:
        return 'bg-success/10 text-success';
      case OrderStatus.Cancelled:
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-surface-elevated text-text-muted';
    }
  }
}
