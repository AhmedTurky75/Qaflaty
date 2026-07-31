import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CustomerService } from '../services/customer.service';
import { BlockedPhoneService } from '../../orders/services/blocked-phone.service';
import { CustomerDto, OrderSummaryDto } from 'shared';
import { OrderCardComponent } from '../../orders/components/order-card/order-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
  ConfirmDialogResult
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoPipe, OrderCardComponent, IconComponent, ConfirmDialogComponent],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  private customerService = inject(CustomerService);
  private blockedPhoneService = inject(BlockedPhoneService);
  private transloco = inject(TranslocoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  blockPending = signal(false);
  blockError = signal<string | null>(null);
  dialog = signal<ConfirmDialogConfig | null>(null);
  private pendingBlockAction = signal<'block' | 'unblock' | null>(null);

  private get storeId(): string {
    return localStorage.getItem('currentStoreId') || '';
  }

  isPhoneBlocked(): boolean {
    return !!this.customer()?.blockedPhoneId;
  }

  onBlockPhone(): void {
    const customer = this.customer();
    if (!customer) return;

    this.pendingBlockAction.set('block');
    this.dialog.set({
      title: this.transloco.translate('customers.blockPhone'),
      message: this.transloco.translate('customers.blockPhoneConfirm', { phone: customer.phone }),
      confirmLabel: this.transloco.translate('customers.blockPhone'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
      icon: 'phone-off',
      reason: {
        label: this.transloco.translate('customers.blockPhoneReasonLabel'),
        placeholder: this.transloco.translate('customers.blockPhoneReasonPlaceholder')
      }
    });
  }

  onUnblockPhone(): void {
    const customer = this.customer();
    if (!customer?.blockedPhoneId) return;

    this.pendingBlockAction.set('unblock');
    this.dialog.set({
      title: this.transloco.translate('customers.unblockPhone'),
      message: this.transloco.translate('customers.unblockPhoneConfirm', { phone: customer.phone }),
      confirmLabel: this.transloco.translate('customers.unblockPhone'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'primary',
      icon: 'check-circle'
    });
  }

  onDialogCancelled(): void {
    this.dialog.set(null);
    this.pendingBlockAction.set(null);
  }

  onDialogConfirmed(result: ConfirmDialogResult): void {
    const customer = this.customer();
    const action = this.pendingBlockAction();
    if (!customer || !action) return;

    this.blockPending.set(true);
    this.blockError.set(null);

    // Typed as unknown so the block/unblock response types unify into one subscribe call.
    const request$: Observable<unknown> = action === 'block'
      ? this.blockedPhoneService.blockPhoneFromCustomer(this.storeId, customer.id, result.reason)
      : this.blockedPhoneService.unblockPhone(this.storeId, customer.blockedPhoneId!);

    request$.subscribe({
      next: () => {
        this.blockPending.set(false);
        this.dialog.set(null);
        this.pendingBlockAction.set(null);
        this.loadCustomerDetails(customer.id);
      },
      error: (err) => {
        this.blockPending.set(false);
        this.dialog.set(null);
        this.pendingBlockAction.set(null);
        this.blockError.set(
          err?.error?.message ||
          this.transloco.translate(action === 'block' ? 'customers.blockPhoneFailed' : 'customers.unblockPhoneFailed')
        );
      }
    });
  }

  customer = signal<CustomerDto | null>(null);
  orders = signal<OrderSummaryDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Notes editing
  isEditingNotes = signal(false);
  notesText = signal('');
  savingNotes = signal(false);
  notesSaved = signal(false);

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    if (customerId) {
      this.loadCustomerDetails(customerId);
    } else {
      this.error.set('Customer ID not found');
      this.loading.set(false);
    }
  }

  loadCustomerDetails(customerId: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      customer: this.customerService.getCustomerById(customerId),
      orders: this.customerService.getCustomerOrders(customerId)
    }).subscribe({
      next: (response) => {
        this.customer.set(response.customer);
        this.orders.set(response.orders);
        this.notesText.set(response.customer.notes || '');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load customer details');
        this.loading.set(false);
      }
    });
  }

  onEditNotes(): void {
    this.isEditingNotes.set(true);
    this.notesSaved.set(false);
  }

  onCancelEditNotes(): void {
    this.isEditingNotes.set(false);
    this.notesText.set(this.customer()?.notes || '');
    this.notesSaved.set(false);
  }

  onSaveNotes(): void {
    const customer = this.customer();
    if (!customer) return;

    this.savingNotes.set(true);
    this.customerService.updateCustomerNotes(customer.id, {
      notes: this.notesText()
    }).subscribe({
      next: (updatedCustomer) => {
        this.customer.set(updatedCustomer);
        this.isEditingNotes.set(false);
        this.savingNotes.set(false);
        this.notesSaved.set(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          this.notesSaved.set(false);
        }, 3000);
      },
      error: (err) => {
        this.savingNotes.set(false);
        alert(err.message || 'Failed to save notes');
      }
    });
  }

  onViewOrderDetails(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  onBack(): void {
    this.router.navigate(['/customers']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
