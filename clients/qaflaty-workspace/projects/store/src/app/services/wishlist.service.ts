import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, catchError, of } from 'rxjs';

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantAttributes?: { [key: string]: string };
  price: number;
  inStock: boolean;
  addedAt: string;
}

export interface Wishlist {
  id: string;
  customerId: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/storefront/wishlist`;

  // State signals
  private readonly _wishlist = signal<Wishlist | null>(null);

  // Public readonly signals
  readonly wishlist = this._wishlist.asReadonly();
  readonly wishlistItems = computed(() => this._wishlist()?.items ?? []);
  readonly wishlistCount = computed(() => this.wishlistItems().length);
  readonly hasItems = computed(() => this.wishlistCount() > 0);

  loadWishlist() {
    return this.http.get<Wishlist>(this.apiUrl).pipe(
      tap(wishlist => this._wishlist.set(wishlist)),
      catchError(error => {
        console.error('Failed to load wishlist', error);
        this._wishlist.set(null);
        throw error;
      })
    );
  }

  addToWishlist(productId: string, variantId?: string) {
    const request = {
      productId,
      variantId: variantId || null
    };

    return this.http.post(this.apiUrl, request).pipe(
      tap(() => {
        // Reload wishlist to get updated state
        this.loadWishlist().subscribe();
      }),
      catchError(error => {
        console.error('Failed to add to wishlist', error);
        throw error;
      })
    );
  }

  removeFromWishlist(productId: string, variantId?: string) {
    const request = {
      productId,
      variantId: variantId || null
    };

    return this.http.request('delete', this.apiUrl, { body: request }).pipe(
      tap(() => {
        // Update local state by filtering out the removed item
        const current = this._wishlist();
        if (current) {
          const updatedItems = current.items.filter(item =>
            !(item.productId === productId && item.variantId === variantId)
          );
          this._wishlist.set({ ...current, items: updatedItems });
        }
      }),
      catchError(error => {
        console.error('Failed to remove from wishlist', error);
        throw error;
      })
    );
  }

  isInWishlist(productId: string, variantId?: string): boolean {
    const items = this.wishlistItems();
    return items.some(item =>
      item.productId === productId && item.variantId === variantId
    );
  }

  toggleWishlist(productId: string, variantId?: string) {
    if (this.isInWishlist(productId, variantId)) {
      return this.removeFromWishlist(productId, variantId);
    } else {
      return this.addToWishlist(productId, variantId);
    }
  }

  clearWishlist(): void {
    this._wishlist.set(null);
  }
}
