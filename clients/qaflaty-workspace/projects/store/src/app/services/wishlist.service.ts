import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductVariant } from '../models/product.model';
import { CustomerAuthService } from './customer-auth.service';

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantAttributes?: { [key: string]: string };
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  inStock: boolean;
  addedAt: string;
}

const GUEST_KEY = 'guest_wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(CustomerAuthService);
  private readonly apiUrl = `${environment.apiUrl}/storefront/wishlist`;

  private readonly _items = signal<WishlistItem[]>([]);
  private readonly _count = signal<number>(0);

  readonly items = this._items.asReadonly();
  readonly count = this._count.asReadonly();
  readonly hasItems = computed(() => this._count() > 0);

  private get isAuth(): boolean {
    return this.auth.isAuthenticated();
  }

  /** Load the full wishlist (and merge any guest items after login). */
  load(): void {
    if (this.isAuth) {
      this.mergeGuestThenLoad();
    } else {
      const items = this.readGuest();
      this._items.set(items);
      this._count.set(items.length);
    }
  }

  private mergeGuestThenLoad(): void {
    const guestItems = this.readGuest();
    if (guestItems.length > 0) {
      const calls = guestItems.map(i =>
        this.http.post(this.apiUrl, { productId: i.productId, variantId: i.variantId || null })
      );
      forkJoin(calls).subscribe({
        next: () => { this.clearGuest(); this.fetchServer(); },
        error: () => { this.clearGuest(); this.fetchServer(); }
      });
    } else {
      this.fetchServer();
    }
  }

  private fetchServer(): void {
    this.http.get<{ items: WishlistItem[] }>(this.apiUrl).subscribe({
      next: (res) => {
        // Normalize variantId (server sends null; the app matches on undefined).
        const items = (res?.items ?? []).map(i => ({ ...i, variantId: i.variantId ?? undefined }));
        this._items.set(items);
        this._count.set(items.length);
      },
      error: () => { this._items.set([]); this._count.set(0); }
    });
  }

  isInWishlist(productId: string, variantId?: string): boolean {
    return this._items().some(i => i.productId === productId && i.variantId === (variantId ?? undefined));
  }

  toggle(product: Product, variant?: ProductVariant): void {
    if (this.isInWishlist(product.id, variant?.id)) {
      this.remove(product.id, variant?.id);
    } else {
      this.add(product, variant);
    }
  }

  add(product: Product, variant?: ProductVariant): void {
    if (this.isInWishlist(product.id, variant?.id)) return;

    const item: WishlistItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: variant?.id,
      variantAttributes: variant?.attributes,
      price: variant?.priceOverride?.amount ?? product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      imageUrl: product.images?.[0]?.url ?? null,
      inStock: variant ? variant.inStock : product.inStock,
      addedAt: new Date().toISOString()
    };

    // Optimistic local update.
    this._items.update(list => [...list, item]);
    this._count.update(c => c + 1);

    if (this.isAuth) {
      this.http.post(this.apiUrl, { productId: product.id, variantId: variant?.id || null }).subscribe({
        error: () => this.removeLocal(product.id, variant?.id)
      });
    } else {
      this.writeGuest(this._items());
    }
  }

  remove(productId: string, variantId?: string): void {
    this.removeLocal(productId, variantId);

    if (this.isAuth) {
      this.http.request('delete', this.apiUrl, {
        body: { productId, variantId: variantId || null }
      }).subscribe({ error: () => this.load() });
    } else {
      this.writeGuest(this._items());
    }
  }

  private removeLocal(productId: string, variantId?: string): void {
    this._items.update(list =>
      list.filter(i => !(i.productId === productId && i.variantId === (variantId ?? undefined)))
    );
    this._count.set(this._items().length);
  }

  /** Called on logout to drop the in-memory authenticated wishlist. */
  clear(): void {
    this._items.set([]);
    this._count.set(0);
  }

  private readGuest(): WishlistItem[] {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private writeGuest(items: WishlistItem[]): void {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  }

  private clearGuest(): void {
    localStorage.removeItem(GUEST_KEY);
  }
}
