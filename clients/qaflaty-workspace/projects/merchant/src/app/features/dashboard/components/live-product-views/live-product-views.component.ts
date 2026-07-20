import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsRealtimeService } from '../../../../core/services/analytics-realtime.service';

/**
 * "Active users on a specific product page" — live viewer counts per product, sourced from
 * AnalyticsRealtimeService (SignalR PresenceUpdated push + HTTP snapshot on connect/reconnect).
 * Mirrors MostWishlistedComponent's layout/style.
 */
@Component({
  selector: 'app-live-product-views',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="relative flex h-2 w-2">
          @if (analyticsRealtime.isConnected()) {
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          }
          <span class="relative inline-flex rounded-full h-2 w-2" [class.bg-green-500]="analyticsRealtime.isConnected()" [class.bg-gray-300]="!analyticsRealtime.isConnected()"></span>
        </span>
        <h3 class="text-lg font-semibold text-gray-900">👀 Live Product Views</h3>
      </div>

      @if (analyticsRealtime.productViewers().length === 0) {
        <p class="text-gray-400 text-sm">No one is currently viewing a product page.</p>
      } @else {
        <ul class="divide-y divide-gray-100">
          @for (p of analyticsRealtime.productViewers(); track p.productId) {
            <li class="flex items-center gap-3 py-2.5">
              <div class="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                @if (p.imageUrl) { <img [src]="p.imageUrl" [alt]="p.productName" class="w-full h-full object-cover" /> }
                @else { <span class="text-gray-300">📦</span> }
              </div>
              <span class="flex-1 min-w-0 truncate text-sm font-medium text-gray-800">{{ p.productName }}</span>
              <span class="inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                {{ p.viewerCount }} watching
              </span>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class LiveProductViewsComponent {
  analyticsRealtime = inject(AnalyticsRealtimeService);
}
