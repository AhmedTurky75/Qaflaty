import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RelatedProductSummary } from './related-products.service';

export interface CrossSellSettings {
  enabled: boolean;
  limit: number;
  excludeOutOfStock: boolean;
}

@Injectable({ providedIn: 'root' })
export class CrossSellService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getCrossSell(storeId: string, productId: string): Observable<RelatedProductSummary[]> {
    return this.http.get<RelatedProductSummary[]>(
      `${this.base}/stores/${storeId}/products/${productId}/cross-sell`);
  }

  getSettings(storeId: string): Observable<CrossSellSettings> {
    return this.http.get<CrossSellSettings>(
      `${this.base}/stores/${storeId}/recommendation-settings/cross-sell`);
  }

  setCrossSell(storeId: string, productId: string, crossSellProductIds: string[]): Observable<void> {
    return this.http.put<void>(
      `${this.base}/stores/${storeId}/products/${productId}/cross-sell`,
      { crossSellProductIds });
  }

  setSettings(storeId: string, settings: CrossSellSettings): Observable<void> {
    return this.http.put<void>(
      `${this.base}/stores/${storeId}/recommendation-settings/cross-sell`,
      settings);
  }
}
