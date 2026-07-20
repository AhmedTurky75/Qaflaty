import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreContextService } from '../../core/services/store-context.service';
import { AnalyticsRealtimeService } from '../../core/services/analytics-realtime.service';

/**
 * Dedicated real-time operations page: who is browsing the store right now, which products they're
 * looking at, and how many carts are open. All data comes from AnalyticsRealtimeService — one HTTP
 * snapshot on load, then live over SignalR (presence pushes carry full data; the only follow-up
 * fetch is when a cart actually changes).
 */
@Component({
  selector: 'app-live',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Live Activity
            <span class="relative flex h-3 w-3">
              @if (analytics.isConnected()) {
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              }
              <span class="relative inline-flex rounded-full h-3 w-3" [class.bg-green-500]="analytics.isConnected()" [class.bg-gray-300]="!analytics.isConnected()"></span>
            </span>
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ analytics.isConnected() ? 'Real-time — updating live' : 'Connecting…' }}
          </p>
        </div>
      </div>

      @if (!storeContext.currentStoreId()) {
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p class="text-yellow-800">Please select a store to view live activity.</p>
        </div>
      } @else {
        <!-- Metric tiles -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p class="text-sm font-medium text-gray-600 mb-1">Active Users Now</p>
            <p class="text-3xl font-bold text-gray-900">{{ analytics.activeUsers() }}</p>
            <p class="text-xs text-gray-400 mt-1">Interacted with your store in the last 10 minutes</p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p class="text-sm font-medium text-gray-600 mb-1">Active Carts Now</p>
            <p class="text-3xl font-bold text-gray-900">{{ analytics.activeCartCount() }}</p>
            <a routerLink="/active-carts" class="text-xs text-primary-600 hover:underline mt-1 inline-block">
              View cart details &rarr;
            </a>
          </div>
        </div>

        <!-- Live product views -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">👀 Who's viewing what</h3>

          @if (analytics.productViewers().length === 0) {
            <p class="text-gray-400 text-sm">No one is currently viewing a product page.</p>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (p of analytics.productViewers(); track p.productId) {
                <li class="flex items-center gap-3 py-2.5">
                  <div class="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    @if (p.imageUrl) { <img [src]="p.imageUrl" [alt]="p.productName" class="w-full h-full object-cover" /> }
                    @else { <span class="text-gray-300">📦</span> }
                  </div>
                  <span class="flex-1 min-w-0 truncate text-sm font-medium text-gray-800">{{ p.productName }}</span>
                  <span class="inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
                    {{ p.viewerCount }} watching
                  </span>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `
})
export class LiveComponent {
  storeContext = inject(StoreContextService);
  analytics = inject(AnalyticsRealtimeService);

  constructor() {
    // Connect (or switch) whenever the selected store changes.
    effect(() => {
      const storeId = this.storeContext.currentStoreId();
      if (storeId) this.analytics.connectToStore(storeId);
    });
  }
}
