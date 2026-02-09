import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from 'shared';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [class]="badgeClasses"
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    >
      {{ statusText }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: OrderStatus;

  get statusText(): string {
    return this.status;
  }

  get badgeClasses(): string {
    switch (this.status) {
      case OrderStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.Confirmed:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.Processing:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.Shipped:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.Delivered:
        return 'bg-green-100 text-green-800';
      case OrderStatus.Cancelled:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
