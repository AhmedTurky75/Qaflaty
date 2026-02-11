import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService, OrderFilters } from '../services/order.service';
import { OrderCardComponent } from '../components/order-card/order-card.component';
import { OrderDto, OrderStatus } from 'shared';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderCardComponent],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);

  orders = signal<OrderDto[]>([]);
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
    { value: OrderStatus.Cancelled, label: 'Cancelled' }
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const storeId = localStorage.getItem('currentStoreId') || '';
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
        this.totalOrders.set(response.total);
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
