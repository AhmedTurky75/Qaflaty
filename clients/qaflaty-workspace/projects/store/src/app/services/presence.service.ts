import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { GuestSessionService } from './guest-session.service';

/**
 * Powers the merchant's live "active users" / "active users per product" metrics.
 *
 * A heartbeat is sent only while the visitor is genuinely active — the tab is visible AND they've
 * interacted (moved/scrolled/typed/tapped) within the recent activity window. An idle tab left
 * open stops sending after that window and drops off the merchant's count once the 10-minute
 * server TTL lapses; it resumes the instant the visitor interacts again. Page/product changes send
 * an immediate heartbeat, and tab close sends a best-effort "leave" beacon. This keeps the endpoint
 * quiet — no fixed forever-polling regardless of what the visitor is doing.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private guestSession = inject(GuestSessionService);

  private static readonly HEARTBEAT_INTERVAL_MS = 30_000;
  // Keep heartbeating for this long after the last interaction, matching the spec's "active if
  // interacted within the last 10 minutes" and the server's 10-minute presence TTL. A tab left
  // idle past this stops sending and drops off once the TTL lapses; any interaction resumes it.
  private static readonly ACTIVITY_WINDOW_MS = 10 * 60_000;

  private currentProductId: string | null = null;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private lastActivityAt = Date.now();
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    this.attachActivityListeners();
    // On a product page, don't send a throwaway productId=null beat — onViewProduct fires the first
    // beat the moment the product loads, so the very first heartbeat already carries the product id.
    if (!this.onProductPage()) this.sendHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isActive()) this.sendHeartbeat();
    }, PresenceService.HEARTBEAT_INTERVAL_MS);

    // pagehide fires reliably on tab close/navigation-away across browsers (unlike beforeunload
    // on mobile Safari); beforeunload is kept as a fallback for older desktop browsers.
    window.addEventListener('pagehide', () => this.sendLeaveBeacon());
    window.addEventListener('beforeunload', () => this.sendLeaveBeacon());
  }

  /** Called on every router navigation — clears product context; a following onViewProduct() re-sets it. */
  onPageView(): void {
    this.currentProductId = null;
    this.lastActivityAt = Date.now();
    // Same as start(): on a product page, let onViewProduct send the first (product-carrying) beat
    // instead of a throwaway null one. Other pages beat immediately to reflect the navigation.
    if (!this.onProductPage()) this.sendHeartbeat();
  }

  /** Called when a product detail page finishes loading a product. */
  onViewProduct(productId: string): void {
    this.currentProductId = productId;
    this.lastActivityAt = Date.now();
    this.sendHeartbeat(); // move this visitor onto the new product's live count right away
  }

  private attachActivityListeners(): void {
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    for (const evt of ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove']) {
      window.addEventListener(evt, () => this.markActivity(), opts);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.markActivity();
    });
  }

  /**
   * Records interaction. Cheap enough to call on every mousemove — it only sends a heartbeat when
   * resuming from an idle/hidden state, not on every event.
   */
  private markActivity(): void {
    const wasInactive = !this.isActive();
    this.lastActivityAt = Date.now();
    if (wasInactive) this.sendHeartbeat();
  }

  private isActive(): boolean {
    return document.visibilityState === 'visible'
      && (Date.now() - this.lastActivityAt) < PresenceService.ACTIVITY_WINDOW_MS;
  }

  /** True on a product detail route (/products/:slug) — the list route (/products) is not a product page. */
  private onProductPage(): boolean {
    return /\/products\/[^/]+/.test(this.router.url);
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
