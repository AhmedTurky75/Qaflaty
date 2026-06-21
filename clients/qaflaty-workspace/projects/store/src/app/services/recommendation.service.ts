import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { GuestSessionService } from './guest-session.service';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private http = inject(HttpClient);
  private guestSession = inject(GuestSessionService);
  private base = `${environment.apiUrl}/storefront`;

  /** Records a product page view (fire-and-forget on the caller side). */
  trackView(productId: string): Observable<void> {
    const sessionId = this.guestSession.getOrCreateGuestId();
    return this.http.post<void>(`${this.base}/products/${productId}/view`, { sessionId });
  }

  getRelated(productId: string, take = 8): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products/${productId}/related`, {
      params: new HttpParams().set('take', take)
    });
  }

  getFrequentlyBoughtTogether(productId: string, take = 4): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products/${productId}/frequently-bought-together`, {
      params: new HttpParams().set('take', take)
    });
  }

  getMostViewed(take = 8, days?: number): Observable<Product[]> {
    let params = new HttpParams().set('take', take);
    if (days != null) params = params.set('days', days);
    return this.http.get<Product[]>(`${this.base}/products/most-viewed`, { params });
  }

  getTrending(take = 8): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products/trending`, {
      params: new HttpParams().set('take', take)
    });
  }

  getNewArrivals(take = 8): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products/new-arrivals`, {
      params: new HttpParams().set('take', take)
    });
  }

  getRecentlyViewed(take = 8): Observable<Product[]> {
    const sessionId = this.guestSession.getGuestId();
    let params = new HttpParams().set('take', take);
    if (sessionId) params = params.set('sessionId', sessionId);
    return this.http.get<Product[]>(`${this.base}/customers/me/recently-viewed`, { params });
  }
}
