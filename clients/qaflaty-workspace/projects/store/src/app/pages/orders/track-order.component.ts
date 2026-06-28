import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { ReturnService } from '../../services/return.service';
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
  private returnService = inject(ReturnService);
  private route = inject(ActivatedRoute);

  order = signal<OrderTracking | null>(null);
  orderNumberInput = signal<string>('');
  contactInput = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Return-request state
  showReturnForm = signal<boolean>(false);
  returnQuantities = signal<Record<string, number>>({});
  returnReason = signal<string>('');
  submittingReturn = signal<boolean>(false);
  returnError = signal<string>('');
  returnSubmitted = signal<boolean>(false);

  get canReturn(): boolean {
    return this.order()?.status === OrderStatus.Delivered;
  }

  openReturnForm(): void {
    const o = this.order();
    if (!o) return;
    const qty: Record<string, number> = {};
    for (const item of o.items) qty[item.productId] = 0;
    this.returnQuantities.set(qty);
    this.returnReason.set('');
    this.returnError.set('');
    this.showReturnForm.set(true);
  }

  setReturnQty(productId: string, max: number, value: string): void {
    let n = Number(value);
    if (isNaN(n) || n < 0) n = 0;
    if (n > max) n = max;
    this.returnQuantities.update(q => ({ ...q, [productId]: n }));
  }

  submitReturn(): void {
    const orderNumber = this.orderNumberInput().trim();
    const contact = this.contactInput().trim();
    const reason = this.returnReason().trim();

    const items = Object.entries(this.returnQuantities())
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      this.returnError.set('Select at least one item to return.');
      return;
    }
    if (!reason) {
      this.returnError.set('Please tell us why you are returning these items.');
      return;
    }

    this.submittingReturn.set(true);
    this.returnError.set('');
    this.returnService.requestGuestReturn(orderNumber, contact, items, reason).subscribe({
      next: () => {
        this.submittingReturn.set(false);
        this.showReturnForm.set(false);
        this.returnSubmitted.set(true);
      },
      error: (e) => {
        this.submittingReturn.set(false);
        this.returnError.set(e?.error?.message ?? 'Could not submit your return request.');
      }
    });
  }

  ngOnInit() {
    // Check if order number + contact are in query params (e.g. from the confirmation page)
    this.route.queryParams.subscribe(params => {
      const orderNumber = params['orderNumber'];
      const contact = params['contact'];
      if (orderNumber) this.orderNumberInput.set(orderNumber);
      if (contact) this.contactInput.set(contact);
      if (orderNumber && contact) {
        this.trackOrder();
      }
    });
  }

  trackOrder() {
    const orderNumber = this.orderNumberInput().trim();
    const contact = this.contactInput().trim();
    if (!orderNumber) {
      this.errorMessage.set('Please enter an order number');
      return;
    }
    if (!contact) {
      this.errorMessage.set('Please enter the email or phone used on the order');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.orderService.trackOrder(orderNumber, contact).subscribe({
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
    this.contactInput.set('');
    this.errorMessage.set('');
    this.showReturnForm.set(false);
    this.returnSubmitted.set(false);
    this.returnError.set('');
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
