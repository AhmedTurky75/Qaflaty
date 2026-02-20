import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE       = `${environment.apiUrl}/storefront/cart`;
const GUEST_BASE = `${environment.apiUrl}/storefront/guest-cart`;

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private http = inject(HttpClient);

  // ── Authenticated cart (fire-and-forget) ──────────────────────────────

  addItem(productId: string, quantity: number, variantId?: string): void {
    this.http.post(`${BASE}/items`, { productId, quantity, variantId: variantId ?? null })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  updateItemQuantity(productId: string, quantity: number, variantId?: string): void {
    const url = variantId
      ? `${BASE}/items/${productId}?variantId=${variantId}`
      : `${BASE}/items/${productId}`;
    this.http.put(url, { quantity })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  removeItem(productId: string, variantId?: string): void {
    const url = variantId
      ? `${BASE}/items/${productId}?variantId=${variantId}`
      : `${BASE}/items/${productId}`;
    this.http.delete(url)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  clearCart(): void {
    this.http.delete(BASE)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  // ── Guest cart (fire-and-forget; X-Guest-Id added by guestCartInterceptor) ──

  addGuestItem(productId: string, quantity: number, variantId?: string): void {
    this.http.post(`${GUEST_BASE}/items`, { productId, quantity, variantId: variantId ?? null })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  updateGuestItemQuantity(productId: string, quantity: number, variantId?: string): void {
    const url = variantId
      ? `${GUEST_BASE}/items/${productId}?variantId=${variantId}`
      : `${GUEST_BASE}/items/${productId}`;
    this.http.put(url, { quantity })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  removeGuestItem(productId: string, variantId?: string): void {
    const url = variantId
      ? `${GUEST_BASE}/items/${productId}?variantId=${variantId}`
      : `${GUEST_BASE}/items/${productId}`;
    this.http.delete(url)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  clearGuestCart(): void {
    this.http.delete(GUEST_BASE)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }
}
