import { Component, inject, signal, OnInit, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { OrderService, OrderFilters } from '../services/order.service';
import { BlockedPhoneService } from '../services/blocked-phone.service';
import { OrderCardComponent } from '../components/order-card/order-card.component';
import { StatusBadgeComponent } from '../components/status-badge/status-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
  ConfirmDialogResult
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { OrderSummaryDto, OrderStatus } from 'shared';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe, OrderCardComponent, StatusBadgeComponent, IconComponent, ConfirmDialogComponent],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private blockedPhoneService = inject(BlockedPhoneService);
  private transloco = inject(TranslocoService);
  private router = inject(Router);

  orders = signal<OrderSummaryDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  selectedStatus = signal<OrderStatus | ''>('');
  dateFrom = signal('');
  dateTo = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(12);
  totalOrders = signal(0);
  totalPages = computed(() => Math.ceil(this.totalOrders() / this.pageSize()));

  OrderStatus = OrderStatus;
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: OrderStatus.Pending, label: 'Pending' },
    { value: OrderStatus.Confirmed, label: 'Confirmed' },
    { value: OrderStatus.Processing, label: 'Processing' },
    { value: OrderStatus.Shipped, label: 'Shipped' },
    { value: OrderStatus.Delivered, label: 'Delivered' },
    { value: OrderStatus.Cancelled, label: 'Cancelled' },
    { value: OrderStatus.Blocked, label: 'Blocked' }
  ];

  // Row action menu. The table wrapper clips overflow, so the menu is rendered fixed-positioned
  // against the trigger's viewport rect rather than absolutely inside the scroll container.
  openMenuOrderId = signal<string | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });
  actionPending = signal(false);
  actionMessage = signal<string | null>(null);
  actionError = signal<string | null>(null);

  // Confirmation dialog state. `pendingAction` remembers which row/action the open dialog belongs
  // to, so a single dialog instance serves block / release / reject.
  dialog = signal<ConfirmDialogConfig | null>(null);
  private pendingAction = signal<{ kind: 'block' | 'unblock' | 'release' | 'reject'; order: OrderSummaryDto } | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  private get storeId(): string {
    return localStorage.getItem('currentStoreId') || '';
  }

  toggleRowMenu(event: MouseEvent, orderId: string): void {
    // The row itself navigates to the order; keep that from firing when using the menu.
    event.stopPropagation();

    if (this.openMenuOrderId() === orderId) {
      this.openMenuOrderId.set(null);
      return;
    }

    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 224;
    const isRtl = document.documentElement.dir === 'rtl';

    this.menuPosition.set({
      top: rect.bottom + 4,
      left: isRtl ? rect.left : Math.max(8, rect.right - menuWidth)
    });

    this.openMenuOrderId.set(orderId);
  }

  closeRowMenu(): void {
    this.openMenuOrderId.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeRowMenu();
  }

  // A fixed-positioned menu does not move with the scroll container, so dismiss it instead.
  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.closeRowMenu();
  }

  onBlockPhone(event: MouseEvent, order: OrderSummaryDto): void {
    event.stopPropagation();
    this.closeRowMenu();

    this.pendingAction.set({ kind: 'block', order });
    this.dialog.set({
      title: this.transloco.translate('orders.blockPhone'),
      message: this.transloco.translate('orders.blockPhoneConfirm', { phone: order.customerPhone }),
      confirmLabel: this.transloco.translate('orders.blockPhone'),
      cancelLabel: this.transloco.translate('orders.close'),
      variant: 'danger',
      icon: 'phone-off',
      reason: {
        label: this.transloco.translate('orders.blockPhoneReasonLabel'),
        placeholder: this.transloco.translate('orders.blockPhoneReasonPlaceholder')
      }
    });
  }

  onUnblockPhone(event: MouseEvent, order: OrderSummaryDto): void {
    event.stopPropagation();
    this.closeRowMenu();

    this.pendingAction.set({ kind: 'unblock', order });
    this.dialog.set({
      title: this.transloco.translate('orders.unblockPhone'),
      message: this.transloco.translate('orders.unblockPhoneConfirm', { phone: order.customerPhone }),
      confirmLabel: this.transloco.translate('orders.unblockPhone'),
      cancelLabel: this.transloco.translate('orders.close'),
      variant: 'primary',
      icon: 'check-circle'
    });
  }

  onReleaseBlockedOrder(event: MouseEvent, order: OrderSummaryDto): void {
    event.stopPropagation();
    this.closeRowMenu();

    this.pendingAction.set({ kind: 'release', order });
    this.dialog.set({
      title: this.transloco.translate('orders.releaseOrder'),
      message: this.transloco.translate('orders.releaseConfirm', { number: order.orderNumber }),
      confirmLabel: this.transloco.translate('orders.releaseOrder'),
      cancelLabel: this.transloco.translate('orders.close'),
      variant: 'primary',
      icon: 'check-circle',
      checkbox: { label: this.transloco.translate('orders.releaseAlsoUnblock') }
    });
  }

  onRejectBlockedOrder(event: MouseEvent, order: OrderSummaryDto): void {
    event.stopPropagation();
    this.closeRowMenu();

    this.pendingAction.set({ kind: 'reject', order });
    this.dialog.set({
      title: this.transloco.translate('orders.rejectOrder'),
      message: this.transloco.translate('orders.rejectConfirm', { number: order.orderNumber }),
      confirmLabel: this.transloco.translate('orders.rejectOrder'),
      cancelLabel: this.transloco.translate('orders.close'),
      variant: 'danger',
      icon: 'x-circle',
      reason: {
        label: this.transloco.translate('orders.rejectReasonLabel'),
        placeholder: this.transloco.translate('orders.rejectReasonPlaceholder')
      }
    });
  }

  onDialogCancelled(): void {
    this.dialog.set(null);
    this.pendingAction.set(null);
  }

  onDialogConfirmed(result: ConfirmDialogResult): void {
    const action = this.pendingAction();
    if (!action) return;

    const { kind, order } = action;

    this.actionPending.set(true);
    this.actionError.set(null);
    this.actionMessage.set(null);

    const done = (messageKey: string, params: Record<string, unknown>) => {
      this.actionPending.set(false);
      this.dialog.set(null);
      this.pendingAction.set(null);
      this.actionMessage.set(this.transloco.translate(messageKey, params));
    };

    const fail = (err: unknown, fallbackKey: string) => {
      this.actionPending.set(false);
      this.dialog.set(null);
      this.pendingAction.set(null);
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.actionError.set(message || this.transloco.translate(fallbackKey));
    };

    if (kind === 'block') {
      this.blockedPhoneService.blockPhoneFromOrder(this.storeId, order.id, result.reason).subscribe({
        next: () => {
          done('orders.blockPhoneSuccess', { phone: order.customerPhone });
          // Reload so every row for this number flips to the Unblock action.
          this.loadOrders();
        },
        error: (err) => fail(err, 'orders.blockPhoneFailed')
      });
      return;
    }

    if (kind === 'unblock') {
      this.blockedPhoneService.unblockPhone(this.storeId, order.blockedPhoneId!).subscribe({
        next: () => {
          done('orders.unblockPhoneSuccess', { phone: order.customerPhone });
          this.loadOrders();
        },
        error: (err) => fail(err, 'orders.unblockPhoneFailed')
      });
      return;
    }

    if (kind === 'release') {
      this.orderService.releaseBlockedOrder(this.storeId, order.id, result.checked).subscribe({
        next: () => {
          done('orders.releaseSuccess', { number: order.orderNumber });
          this.loadOrders();
        },
        error: (err) => fail(err, 'orders.releaseFailed')
      });
      return;
    }

    this.orderService.rejectBlockedOrder(this.storeId, order.id, result.reason).subscribe({
      next: () => {
        done('orders.rejectSuccess', { number: order.orderNumber });
        this.loadOrders();
      },
      error: (err) => fail(err, 'orders.rejectFailed')
    });
  }

  loadOrders(): void {
    const storeId = this.storeId;
    if (!storeId) {
      this.error.set('Please select a store first');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const filters: OrderFilters = {
      page: this.currentPage(),
      limit: this.pageSize()
    };

    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }
    if (this.selectedStatus()) {
      filters.status = this.selectedStatus() as OrderStatus;
    }
    if (this.dateFrom()) {
      filters.dateFrom = this.dateFrom();
    }
    if (this.dateTo()) {
      filters.dateTo = this.dateTo();
    }

    this.orderService.getOrders(storeId, filters).subscribe({
      next: (response) => {
        this.orders.set(response.items);
        this.totalOrders.set(response.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load orders');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  onClearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onViewOrderDetails(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(amount);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots.filter(x => typeof x === 'number') as number[];
  }

  get Math() {
    return Math;
  }
}
