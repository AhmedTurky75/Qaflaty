import { Component, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreContextService } from '../../core/services/store-context.service';
import { AnalyticsRealtimeService } from '../../core/services/analytics-realtime.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * Dedicated real-time operations page: who is browsing the store right now, which products they're
 * looking at, and how many carts are open. All data comes from AnalyticsRealtimeService — one HTTP
 * snapshot on load, then live over SignalR (presence pushes carry full data; the only follow-up
 * fetch is when a cart actually changes).
 */
@Component({
  selector: 'app-live',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './live.component.html',
  styleUrl: './live.component.scss',
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
