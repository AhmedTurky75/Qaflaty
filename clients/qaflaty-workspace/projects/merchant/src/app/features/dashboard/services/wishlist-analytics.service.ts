import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MostWishlistedProduct {
  productId: string;
  productName: string;
  productSlug: string;
  wishlistCount: number;
  imageUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class WishlistAnalyticsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMostWishlisted(storeId: string, take = 5): Observable<MostWishlistedProduct[]> {
    return this.http.get<MostWishlistedProduct[]>(
      `${this.base}/stores/${storeId}/analytics/most-wishlisted`,
      { params: new HttpParams().set('take', take) });
  }
}
