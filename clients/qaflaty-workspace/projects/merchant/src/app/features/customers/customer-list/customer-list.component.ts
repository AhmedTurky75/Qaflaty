import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import { CustomerDto, CustomerFilters, CustomerSortBy } from 'shared';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private searchSubject = new Subject<string>();

  customers = signal<CustomerDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

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
        this.customers.set(response.customers);
        this.totalCustomers.set(response.total);
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
