import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, TrackingLogRowDto } from '../services/ads.service';

const TEST_EVENTS = [
  { type: 'Purchase', label: 'Send Test Purchase' },
  { type: 'InitiateCheckout', label: 'Send Test Checkout' },
  { type: 'ViewContent', label: 'Send Test ViewContent' },
  { type: 'AddToCart', label: 'Send Test AddToCart' }
];

@Component({
  selector: 'app-ads-test-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ads-test-center.component.html',
  styleUrl: './ads-test-center.component.scss'
})
export class AdsTestCenterComponent {
  private adsService = inject(AdsService);
  private storeContext = inject(StoreContextService);

  testEvents = TEST_EVENTS;
  sending = signal<string | null>(null);
  results = signal<TrackingLogRowDto[]>([]);
  error = signal<string | null>(null);

  send(eventType: string): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.sending.set(eventType);
    this.error.set(null);
    this.adsService.sendTestEvent(storeId, eventType).subscribe({
      next: (rows) => {
        this.results.set(rows);
        this.sending.set(null);
        if (rows.length === 0) {
          this.error.set('No providers are enabled for server tracking, so nothing was sent.');
        }
      },
      error: (err) => {
        this.sending.set(null);
        this.error.set(err.error?.message || 'Failed to send test event.');
      }
    });
  }

  statusColor(status: string): string {
    switch (status) {
      case 'Succeeded': return 'text-success';
      case 'Failed': return 'text-danger';
      case 'DeadLettered': return 'text-danger';
      default: return 'text-text-muted';
    }
  }
}
