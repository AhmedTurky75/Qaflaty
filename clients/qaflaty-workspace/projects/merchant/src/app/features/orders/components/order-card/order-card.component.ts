import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderDto } from 'shared';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss']
})
export class OrderCardComponent {
  @Input({ required: true }) order!: OrderDto;
  @Output() viewDetails = new EventEmitter<string>();

  get customerName(): string {
    // Extract customer name from the first status change or use a placeholder
    return 'Customer';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.order.id);
  }
}
