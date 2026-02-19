import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/storefront/cart`;

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private http = inject(HttpClient);

  /** Add or increment an item in the server cart (fire-and-forget). */
  addItem(productId: string, quantity: number, variantId?: string): void {
    this.http.post(`${BASE}/items`, { productId, quantity, variantId: variantId ?? null })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  /** Update an item's quantity in the server cart (fire-and-forget). */
  updateItemQuantity(productId: string, quantity: number, variantId?: string): void {
    const url = variantId
      ? `${BASE}/items/${productId}?variantId=${variantId}`
      : `${BASE}/items/${productId}`;
    this.http.put(url, { quantity })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  /** Remove an item from the server cart (fire-and-forget). */
  removeItem(productId: string, variantId?: string): void {
    const url = variantId
      ? `${BASE}/items/${productId}?variantId=${variantId}`
      : `${BASE}/items/${productId}`;
    this.http.delete(url)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  /** Clear the entire server cart (fire-and-forget). */
  clearCart(): void {
    this.http.delete(BASE)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }
}
