import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PromoValidationItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

export interface PromoValidationResult {
  isValid: boolean;
  code: string;
  discountType?: 'Percentage' | 'FixedAmount' | 'FreeShipping' | null;
  discountAmount: number;
  subtotal: number;
  freeShipping: boolean;
  message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PromoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/storefront/promo`;

  /**
   * Validates a promo code against the current cart contents. The X-Store-Slug header
   * (added by the store-header interceptor) resolves the tenant server-side.
   */
  validate(code: string, items: PromoValidationItem[]): Observable<PromoValidationResult> {
    return this.http.post<PromoValidationResult>(`${this.apiUrl}/validate`, { code, items });
  }
}
