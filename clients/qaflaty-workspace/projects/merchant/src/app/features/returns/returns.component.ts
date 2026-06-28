import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../core/services/store-context.service';
import { ReturnsService, ReturnRequestDto } from './services/returns.service';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns.component.html',
  styleUrls: ['./returns.component.scss']
})
export class ReturnsComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private service = inject(ReturnsService);

  readonly statuses = ['Requested', 'Approved', 'Rejected', 'Refunded', 'Cancelled'];

  returns = signal<ReturnRequestDto[]>([]);
  loading = signal(false);
  activeStatus = signal<string>('Requested');
  busyId = signal<string | null>(null);

  pendingCount = computed(() => this.returns().filter(r => r.status === 'Requested').length);

  private get storeId(): string | null {
    return this.storeContext.currentStoreId();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.loading.set(true);
    this.service.getReturns(storeId, this.activeStatus()).subscribe({
      next: (r) => { this.returns.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setStatus(status: string): void {
    this.activeStatus.set(status);
    this.load();
  }

  approve(r: ReturnRequestDto): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.busyId.set(r.id);
    this.service.approve(storeId, r.id).subscribe({
      next: () => { this.busyId.set(null); this.load(); },
      error: () => this.busyId.set(null)
    });
  }

  reject(r: ReturnRequestDto): void {
    const storeId = this.storeId;
    if (!storeId) return;
    const reason = prompt('Reason for rejecting this return:');
    if (!reason) return;
    this.busyId.set(r.id);
    this.service.reject(storeId, r.id, reason).subscribe({
      next: () => { this.busyId.set(null); this.load(); },
      error: () => this.busyId.set(null)
    });
  }

  refund(r: ReturnRequestDto): void {
    const storeId = this.storeId;
    if (!storeId) return;
    if (!confirm(`Issue a refund of ${r.refundAmount.amount} ${r.refundAmount.currency} for ${r.orderNumber}?`)) return;
    this.busyId.set(r.id);
    this.service.refund(storeId, r.id).subscribe({
      next: () => { this.busyId.set(null); this.load(); },
      error: () => this.busyId.set(null)
    });
  }
}
