import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, EventTimelineDto } from '../services/ads.service';

@Component({
  selector: 'app-ads-event-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ads-event-timeline.component.html',
  styleUrl: './ads-event-timeline.component.scss'
})
export class AdsEventTimelineComponent {
  private adsService = inject(AdsService);
  private storeContext = inject(StoreContextService);

  orderIdInput = signal('');
  timeline = signal<EventTimelineDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  search(): void {
    const storeId = this.storeContext.currentStoreId();
    const orderId = this.orderIdInput().trim();
    if (!storeId || !orderId) return;

    this.loading.set(true);
    this.error.set(null);
    this.timeline.set(null);
    this.adsService.getEventTimeline(storeId, orderId).subscribe({
      next: (dto) => {
        this.timeline.set(dto);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No tracking events found for this order.');
        this.loading.set(false);
      }
    });
  }

  statusColor(status: string): string {
    switch (status) {
      case 'Succeeded': return 'text-success';
      case 'Failed': return 'text-danger';
      case 'DeadLettered': return 'text-danger';
      case 'Processing': return 'text-primary';
      default: return 'text-text-muted';
    }
  }
}
