import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import { CustomerDto, OrderDto } from 'shared';
import { OrderCardComponent } from '../../orders/components/order-card/order-card.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OrderCardComponent],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  private customerService = inject(CustomerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  customer = signal<CustomerDto | null>(null);
  orders = signal<OrderDto[]>([]);
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
