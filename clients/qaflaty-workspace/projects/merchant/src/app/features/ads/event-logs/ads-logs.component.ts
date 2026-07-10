import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, TrackingLogRowDto } from '../services/ads.service';

@Component({
  selector: 'app-ads-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ads-logs.component.html'
})
export class AdsLogsComponent {
  private adsService = inject(AdsService);
  private storeContext = inject(StoreContextService);

  rows = signal<TrackingLogRowDto[]>([]);
  totalCount = signal(0);
  pageNumber = signal(1);
  pageSize = 25;
  loading = signal(false);
  statusFilter = signal('');
  eventTypeFilter = signal('');
  replaying = signal<string | null>(null);

  private storeId = '';

  constructor() {
    effect(() => {
      const id = this.storeContext.currentStoreId();
      if (id) {
        this.storeId = id;
        this.load();
      }
    });
  }

  load(): void {
    if (!this.storeId) return;
    this.loading.set(true);
    this.adsService.getLogs(this.storeId, {
      status: this.statusFilter() || undefined,
      eventType: this.eventTypeFilter() || undefined,
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize
    }).subscribe({
      next: (page) => {
        this.rows.set(page.items);
        this.totalCount.set(page.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.load();
  }

  nextPage(): void {
    if (this.pageNumber() * this.pageSize < this.totalCount()) {
      this.pageNumber.update(p => p + 1);
      this.load();
    }
  }

  prevPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(p => p - 1);
      this.load();
    }
  }

  replay(row: TrackingLogRowDto): void {
    if (!row.dispatchLogId || row.dispatchLogId === '00000000-0000-0000-0000-000000000000') return;
    this.replaying.set(row.dispatchLogId);
    this.adsService.replayEvent(this.storeId, row.trackingEventId, row.dispatchLogId).subscribe({
      next: () => {
        this.replaying.set(null);
        this.load();
      },
      error: () => this.replaying.set(null)
    });
  }

  canReplay(row: TrackingLogRowDto): boolean {
    return (row.status === 'Failed' || row.status === 'DeadLettered') &&
      row.dispatchLogId !== '00000000-0000-0000-0000-000000000000';
  }

  statusColor(status: string): string {
    switch (status) {
      case 'Succeeded': return 'text-green-600';
      case 'Failed': return 'text-red-600';
      case 'DeadLettered': return 'text-red-800';
      case 'Processing': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  }
}
