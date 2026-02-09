import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../services/order.service';
import { StatusBadgeComponent } from '../components/status-badge/status-badge.component';
import { OrderTimelineComponent } from '../components/order-timeline/order-timeline.component';
import { OrderDto, OrderStatus, PaymentStatus } from 'shared';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent, OrderTimelineComponent],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order = signal<OrderDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionLoading = signal(false);

  // Cancel order modal
  showCancelModal = signal(false);
  cancelReason = signal('');

  // Add note modal
  showNoteModal = signal(false);
  newNote = signal('');

  OrderStatus = OrderStatus;
  PaymentStatus = PaymentStatus;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  loadOrder(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load order');
        this.loading.set(false);
      }
    });
  }

  canConfirm(): boolean {
    return this.order()?.status === OrderStatus.Pending;
  }

  canProcess(): boolean {
    return this.order()?.status === OrderStatus.Confirmed;
  }

  canShip(): boolean {
    const order = this.order();
    return order?.status === OrderStatus.Processing &&
           (order.payment.status === PaymentStatus.Paid || order.payment.method === 'CashOnDelivery');
  }

  canDeliver(): boolean {
    return this.order()?.status === OrderStatus.Shipped;
  }

  canCancel(): boolean {
    const status = this.order()?.status;
    return status !== OrderStatus.Delivered && status !== OrderStatus.Cancelled;
  }

  onConfirmOrder(): void {
    const order = this.order();
    if (!order) return;

    this.actionLoading.set(true);
    this.orderService.confirmOrder(order.id).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.actionLoading.set(false);
      },
      error: (err) => {
        alert(`Failed to confirm order: ${err.message}`);
        this.actionLoading.set(false);
      }
    });
  }

  onProcessOrder(): void {
    const order = this.order();
    if (!order) return;

    this.actionLoading.set(true);
    this.orderService.processOrder(order.id).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.actionLoading.set(false);
      },
      error: (err) => {
        alert(`Failed to process order: ${err.message}`);
        this.actionLoading.set(false);
      }
    });
  }

  onShipOrder(): void {
    const order = this.order();
    if (!order) return;

    this.actionLoading.set(true);
    this.orderService.shipOrder(order.id).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.actionLoading.set(false);
      },
      error: (err) => {
        alert(`Failed to ship order: ${err.message}`);
        this.actionLoading.set(false);
      }
    });
  }

  onDeliverOrder(): void {
    const order = this.order();
    if (!order) return;

    this.actionLoading.set(true);
    this.orderService.deliverOrder(order.id).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.actionLoading.set(false);
      },
      error: (err) => {
        alert(`Failed to deliver order: ${err.message}`);
        this.actionLoading.set(false);
      }
    });
  }

  openCancelModal(): void {
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.cancelReason.set('');
  }

  onCancelOrder(): void {
    const order = this.order();
    const reason = this.cancelReason().trim();

    if (!order || !reason) {
      alert('Please provide a reason for cancellation');
      return;
    }

    this.actionLoading.set(true);
    this.orderService.cancelOrder(order.id, { reason }).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.actionLoading.set(false);
        this.closeCancelModal();
      },
      error: (err) => {
        alert(`Failed to cancel order: ${err.message}`);
        this.actionLoading.set(false);
      }
    });
  }

  openNoteModal(): void {
    this.showNoteModal.set(true);
  }

  closeNoteModal(): void {
    this.showNoteModal.set(false);
    this.newNote.set('');
  }

  onAddNote(): void {
    const order = this.order();
    const note = this.newNote().trim();

    if (!order || !note) {
      alert('Please enter a note');
      return;
    }

    this.actionLoading.set(true);
    this.orderService.addOrderNote(order.id, { note }).subscribe({
      next: (updatedOrder) => {
        this.order.set(updatedOrder);
        this.actionLoading.set(false);
        this.closeNoteModal();
      },
      error: (err) => {
        alert(`Failed to add note: ${err.message}`);
        this.actionLoading.set(false);
      }
    });
  }

  onPrintInvoice(): void {
    alert('Print invoice functionality will be implemented');
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }
}
