import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { GuestSessionService } from './guest-session.service';

/**
 * Powers the merchant dashboard's live "active users" / "active users per product" metrics.
 * Sends a heartbeat every 30s (paused while the tab is hidden) plus an immediate one on every
 * page/product change, and a best-effort "leave" beacon on tab/browser close. The 10-minute
 * server-side TTL is the correctness backstop if any of these signals is lost.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private http = inject(HttpClient);
  private guestSession = inject(GuestSessionService);

  private static readonly HEARTBEAT_INTERVAL_MS = 30_000;

  private currentProductId: string | null = null;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    this.sendHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') this.sendHeartbeat();
    }, PresenceService.HEARTBEAT_INTERVAL_MS);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.sendHeartbeat();
    });

    // pagehide fires reliably on tab close/navigation-away across browsers (unlike beforeunload
    // on mobile Safari); beforeunload is kept as a fallback for older desktop browsers.
    window.addEventListener('pagehide', () => this.sendLeaveBeacon());
    window.addEventListener('beforeunload', () => this.sendLeaveBeacon());
  }

  /** Called on every router navigation — clears product context; a following onViewProduct() call re-sets it. */
  onPageView(): void {
    this.currentProductId = null;
    this.sendHeartbeat();
  }

  /** Called when a product detail page finishes loading a product. */
  onViewProduct(productId: string): void {
    this.currentProductId = productId;
    this.sendHeartbeat();
  }

  private sendHeartbeat(): void {
    if (document.visibilityState === 'hidden') return;

    this.http.post(`${environment.apiUrl}/storefront/presence/heartbeat`, {
      productId: this.currentProductId
    }).subscribe({ next: () => {}, error: () => {} });
  }

  /**
   * fetch(..., {keepalive: true}) survives page unload like navigator.sendBeacon, but — unlike
   * sendBeacon — supports custom headers, which this call needs (X-Store-Slug / X-Guest-Id) since
   * it bypasses Angular's HttpClient interceptor pipeline entirely.
   */
  private sendLeaveBeacon(): void {
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain'
    };

    if (!environment.production) {
      headers['X-Store-Slug'] = localStorage.getItem('dev-store-slug') || 'demo-store';
    }

    const guestId = this.guestSession.getGuestId();
    if (guestId) headers['X-Guest-Id'] = guestId;

    try {
      fetch(`${environment.apiUrl}/storefront/presence/leave`, {
        method: 'POST',
        headers,
        body: '{}',
        keepalive: true,
        credentials: 'include'
      }).catch(() => {});
    } catch {
      // Best-effort — never let a beacon failure surface to the departing page.
    }
  }
}
