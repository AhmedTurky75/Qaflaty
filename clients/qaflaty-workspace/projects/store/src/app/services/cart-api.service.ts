import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, EMPTY, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { BackendCart } from '../models/cart.model';
import { Product } from '../models/product.model';

const BASE       = `${environment.apiUrl}/storefront/cart`;
const GUEST_BASE = `${environment.apiUrl}/storefront/guest-cart`;

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private http = inject(HttpClient);

  // ── Fetch cart (returns Observable) ──────────────────────────────────────

  getCart(): Observable<BackendCart | null> {
    return this.http.get<BackendCart>(BASE).pipe(
      catchError(() => of(null))
    );
  }

  getGuestCart(): Observable<BackendCart | null> {
    return this.http.get<BackendCart>(GUEST_BASE).pipe(
      catchError(() => of(null))
    );
  }

  // ── Cart cross-sell ("Complete your order") ──────────────────────────────

  getCartCrossSell(take = 4): Observable<Product[]> {
    return this.http.get<Product[]>(`${BASE}/cross-sell`, {
      params: new HttpParams().set('take', take)
    }).pipe(catchError(() => of([])));
  }

  getGuestCartCrossSell(take = 4): Observable<Product[]> {
    return this.http.get<Product[]>(`${GUEST_BASE}/cross-sell`, {
      params: new HttpParams().set('take', take)
    }).pipe(catchError(() => of([])));
  }

  // ── Cart upsell ("Upgrade Your Choice") ──────────────────────────────────

  getCartUpSell(take = 4): Observable<Product[]> {
    return this.http.get<Product[]>(`${BASE}/upsell`, {
      params: new HttpParams().set('take', take)
    }).pipe(catchError(() => of([])));
  }

  getGuestCartUpSell(take = 4): Observable<Product[]> {
    return this.http.get<Product[]>(`${GUEST_BASE}/upsell`, {
      params: new HttpParams().set('take', take)
    }).pipe(catchError(() => of([])));
  }

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
