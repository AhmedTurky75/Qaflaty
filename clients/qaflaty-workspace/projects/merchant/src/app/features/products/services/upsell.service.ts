import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RelatedProductSummary } from './related-products.service';

export interface UpSellSettings {
  enabled: boolean;
  limit: number;
  excludeOutOfStock: boolean;
}

@Injectable({ providedIn: 'root' })
export class UpSellService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getUpSell(storeId: string, productId: string): Observable<RelatedProductSummary[]> {
    return this.http.get<RelatedProductSummary[]>(
      `${this.base}/stores/${storeId}/products/${productId}/upsell`);
  }

  setUpSell(storeId: string, productId: string, upSellProductIds: string[]): Observable<void> {
    return this.http.put<void>(
      `${this.base}/stores/${storeId}/products/${productId}/upsell`,
      { upSellProductIds });
  }

  getSettings(storeId: string): Observable<UpSellSettings> {
    return this.http.get<UpSellSettings>(
      `${this.base}/stores/${storeId}/recommendation-settings/upsell`);
  }

  setSettings(storeId: string, settings: UpSellSettings): Observable<void> {
    return this.http.put<void>(
      `${this.base}/stores/${storeId}/recommendation-settings/upsell`,
      settings);
  }
}
