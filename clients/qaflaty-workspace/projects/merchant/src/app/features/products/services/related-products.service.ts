import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RelatedProductSummary {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  inStock: boolean;
  images: { id: string; url: string; altText?: string; sortOrder: number }[];
}

export interface ManualRelatedProducts {
  manual: boolean;
  selected: RelatedProductSummary[];
}

@Injectable({ providedIn: 'root' })
export class RelatedProductsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getManualRelated(storeId: string, productId: string): Observable<ManualRelatedProducts> {
    return this.http.get<ManualRelatedProducts>(
      `${this.base}/stores/${storeId}/products/${productId}/related-products`);
  }

  setManualRelated(storeId: string, productId: string, relatedProductIds: string[]): Observable<void> {
    return this.http.put<void>(
      `${this.base}/stores/${storeId}/products/${productId}/related-products`,
      { relatedProductIds });
  }

  setMode(storeId: string, manual: boolean): Observable<void> {
    return this.http.put<void>(
      `${this.base}/stores/${storeId}/recommendation-settings/related-mode`,
      { manual });
  }
}
