import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { OrderTracking, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css']
})
export class TrackOrderComponent {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  order = signal<OrderTracking | null>(null);
  orderNumberInput = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit() {
    // Check if order number is in query params
    this.route.queryParams.subscribe(params => {
      const orderNumber = params['orderNumber'];
      if (orderNumber) {
        this.orderNumberInput.set(orderNumber);
        this.trackOrder();
      }
    });
  }

  trackOrder() {
    const orderNumber = this.orderNumberInput().trim();
    if (!orderNumber) {
      this.errorMessage.set('Please enter an order number');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.orderService.trackOrder(orderNumber).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to track order:', error);
        this.errorMessage.set(
          error.error?.message || 'Order not found. Please check your order number and try again.'
        );
        this.loading.set(false);
      }
    });
  }

  resetSearch() {
    this.order.set(null);
    this.orderNumberInput.set('');
    this.errorMessage.set('');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.Confirmed]: 'bg-blue-100 text-blue-800',
      [OrderStatus.Processing]: 'bg-purple-100 text-purple-800',
      [OrderStatus.Shipped]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.Delivered]: 'bg-green-100 text-green-800',
      [OrderStatus.Cancelled]: 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
