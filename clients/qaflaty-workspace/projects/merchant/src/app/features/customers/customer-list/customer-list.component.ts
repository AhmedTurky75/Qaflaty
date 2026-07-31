import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, Observable, Subject } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CustomerService } from '../services/customer.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
  ConfirmDialogResult
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BlockedPhoneService } from '../../orders/services/blocked-phone.service';
import { CustomerListDto, CustomerFilters, CustomerSortBy } from 'shared';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe, IconComponent, ConfirmDialogComponent],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private blockedPhoneService = inject(BlockedPhoneService);
  private transloco = inject(TranslocoService);
  private router = inject(Router);
  private searchSubject = new Subject<string>();

  customers = signal<CustomerListDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  blockPending = signal(false);
  dialog = signal<ConfirmDialogConfig | null>(null);
  private pendingBlockCustomer = signal<CustomerListDto | null>(null);

  onToggleBlock(event: Event, customer: CustomerListDto): void {
    // The row navigates to the customer; keep that from firing when using the action.
    event.stopPropagation();

    this.pendingBlockCustomer.set(customer);

    this.dialog.set(customer.blockedPhoneId
      ? {
          title: this.transloco.translate('customers.unblockPhone'),
          message: this.transloco.translate('customers.unblockPhoneConfirm', { phone: customer.phone }),
          confirmLabel: this.transloco.translate('customers.unblockPhone'),
          cancelLabel: this.transloco.translate('common.cancel'),
          variant: 'primary',
          icon: 'check-circle'
        }
      : {
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

  onDialogCancelled(): void {
    this.dialog.set(null);
    this.pendingBlockCustomer.set(null);
  }

  onDialogConfirmed(result: ConfirmDialogResult): void {
    const customer = this.pendingBlockCustomer();
    const storeId = localStorage.getItem('currentStoreId') || '';
    if (!customer || !storeId) return;

    const isUnblocking = !!customer.blockedPhoneId;

    this.blockPending.set(true);
    this.error.set(null);

    // Typed as unknown so the block/unblock response types unify into one subscribe call.
    const request$: Observable<unknown> = isUnblocking
      ? this.blockedPhoneService.unblockPhone(storeId, customer.blockedPhoneId!)
      : this.blockedPhoneService.blockPhoneFromCustomer(storeId, customer.id, result.reason);

    request$.subscribe({
      next: () => {
        this.blockPending.set(false);
        this.dialog.set(null);
        this.pendingBlockCustomer.set(null);
        this.loadCustomers();
      },
      error: (err) => {
        this.blockPending.set(false);
        this.dialog.set(null);
        this.pendingBlockCustomer.set(null);
        this.error.set(
          err?.error?.message ||
          this.transloco.translate(isUnblocking ? 'customers.unblockPhoneFailed' : 'customers.blockPhoneFailed')
        );
      }
    });
  }

  // Filters
  searchQuery = signal('');
  sortBy = signal<CustomerSortBy>(CustomerSortBy.Name);
  sortOrder = signal<'asc' | 'desc'>('asc');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalCustomers = signal(0);
  totalPages = computed(() => Math.ceil(this.totalCustomers() / this.pageSize()));

  // View mode
  viewMode = signal<'table' | 'cards'>('table');

  CustomerSortBy = CustomerSortBy;
  sortOptions = [
    { value: CustomerSortBy.Name, label: 'Name' },
    { value: CustomerSortBy.OrdersCount, label: 'Orders Count' },
    { value: CustomerSortBy.TotalSpent, label: 'Total Spent' },
    { value: CustomerSortBy.LastOrderDate, label: 'Last Order Date' }
  ];

  ngOnInit(): void {
    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadCustomers();
    });

    // Detect screen size for default view mode
    if (window.innerWidth < 768) {
      this.viewMode.set('cards');
    }

    this.loadCustomers();
  }

  loadCustomers(): void {
    const storeId = localStorage.getItem('currentStoreId') || '';
    if (!storeId) {
      this.error.set('Please select a store first');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const filters: CustomerFilters = {
      page: this.currentPage(),
      limit: this.pageSize(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder()
    };

    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }

    this.customerService.getCustomers(storeId, filters).subscribe({
      next: (response) => {
        this.customers.set(response.items ?? []);
        this.totalCustomers.set(response.totalCount ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load customers');
        this.loading.set(false);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onSortChange(): void {
    this.currentPage.set(1);
    this.loadCustomers();
  }

  toggleSortOrder(): void {
    this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    this.loadCustomers();
  }

  onClearFilters(): void {
    this.searchQuery.set('');
    this.sortBy.set(CustomerSortBy.Name);
    this.sortOrder.set('asc');
    this.currentPage.set(1);
    this.loadCustomers();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadCustomers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onViewCustomerDetails(customerId: string): void {
    this.router.navigate(['/customers', customerId]);
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'table' ? 'cards' : 'table');
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
      month: 'short',
      day: 'numeric'
    });
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
