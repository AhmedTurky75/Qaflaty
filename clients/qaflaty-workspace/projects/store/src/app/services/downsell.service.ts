import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { GuestSessionService } from './guest-session.service';

export type DownsellSurface = 'ProductDetails' | 'Cart';
export type DownsellTriggerType = 'ExitIntentPdp' | 'DwellTimePdp' | 'CartItemRemoved' | 'CartInactivity';
export type DownsellEventType = 'Accept' | 'Dismiss' | 'CouponRedeemed' | 'Converted';

export interface DownsellCouponPreview {
  code: string;
  discountType: string;
  value: number;
  description?: string | null;
}

export interface DownsellDecision {
  downsellProducts: Product[];
  coupon: DownsellCouponPreview | null;
}

/**
 * Client only reports "I detected a signal" — the server decides whether that signal maps to
 * an enabled rule, whether the session's frequency cap allows another impression, and what (if
 * anything) to show. Never shows more than one offer at a time.
 */
@Injectable({ providedIn: 'root' })
export class DownsellService {
  private http = inject(HttpClient);
  private guestSession = inject(GuestSessionService);
  private base = `${environment.apiUrl}/storefront/downsell`;

  activeOffer = signal<DownsellDecision | null>(null);

  private lastTriggerType: DownsellTriggerType | null = null;
  private lastProductId: string | null = null;
  private pending = false;

  evaluate(surface: DownsellSurface, triggerType: DownsellTriggerType, productId?: string, elapsedSeconds?: number): void {
    if (this.activeOffer() || this.pending) return; // never stack offers or double-fire

    this.pending = true;
    const sessionId = this.guestSession.getOrCreateGuestId();

    this.http.post<DownsellDecision | null>(`${this.base}/evaluate`, {
      surface, triggerType, productId, sessionId, elapsedSeconds
    }).subscribe({
      next: (decision) => {
        this.pending = false;
        if (decision) {
          this.lastTriggerType = triggerType;
          this.lastProductId = productId ?? null;
          this.activeOffer.set(decision);
        }
      },
      error: () => { this.pending = false; }
    });
  }

  accept(): void {
    this.recordEvent('Accept');
    this.activeOffer.set(null);
  }

  dismiss(): void {
    this.recordEvent('Dismiss');
    this.activeOffer.set(null);
  }

  private recordEvent(eventType: DownsellEventType): void {
    const sessionId = this.guestSession.getOrCreateGuestId();
    this.http.post(`${this.base}/events`, {
      eventType,
      triggerType: this.lastTriggerType,
      productId: this.lastProductId,
      sessionId
    }).subscribe({ error: () => {} });
  }
}
