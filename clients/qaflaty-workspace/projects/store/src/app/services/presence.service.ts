import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { GuestSessionService } from './guest-session.service';

/**
 * Powers the merchant's live "active users" / "active users per product" metrics.
 *
 * Presence is route-driven: the current product is read from the page URL (/products/:slug), which
 * is known synchronously — no waiting for the product's data to load — so the very first heartbeat
 * on a product page already carries the right product, even on refresh or a pasted URL.
 *
 * A heartbeat is sent only while the visitor is genuinely active — the tab is visible AND they've
 * interacted (moved/scrolled/typed/tapped) within the recent activity window. An idle tab left
 * open stops sending after that window and drops off the merchant's count once the 10-minute
 * server TTL lapses; it resumes the instant the visitor interacts again. Navigation sends an
 * immediate heartbeat, and tab close sends a best-effort "leave" beacon.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private http = inject(HttpClient);
  private guestSession = inject(GuestSessionService);

  private static readonly HEARTBEAT_INTERVAL_MS = 30_000;
  // Keep heartbeating for this long after the last interaction, matching the spec's "active if
  // interacted within the last 10 minutes" and the server's 10-minute presence TTL. A tab left
  // idle past this stops sending and drops off once the TTL lapses; any interaction resumes it.
  private static readonly ACTIVITY_WINDOW_MS = 10 * 60_000;

  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private lastActivityAt = Date.now();
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    this.attachActivityListeners();
    // Beat immediately for the page we loaded on (product slug read from the URL — no fetch needed).
    this.sendHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isActive()) this.sendHeartbeat();
    }, PresenceService.HEARTBEAT_INTERVAL_MS);

    // pagehide fires reliably on tab close/navigation-away across browsers (unlike beforeunload
    // on mobile Safari); beforeunload is kept as a fallback for older desktop browsers.
    window.addEventListener('pagehide', () => this.sendLeaveBeacon());
    window.addEventListener('beforeunload', () => this.sendLeaveBeacon());
  }

  /** Called on every router navigation — the new product slug is read from the URL at send time. */
  onPageView(): void {
    this.lastActivityAt = Date.now();
    this.sendHeartbeat(); // navigation is an explicit action — reflect the new page immediately
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

  /**
   * The product slug for the current page, read from the URL (/products/:slug), or null when not on
   * a product detail page. Available synchronously, so a heartbeat never has to wait for product data.
   */
  private currentProductSlug(): string | null {
    const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private sendHeartbeat(): void {
    if (document.visibilityState === 'hidden') return;

    this.http.post(`${environment.apiUrl}/storefront/presence/heartbeat`, {
      productSlug: this.currentProductSlug()
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
