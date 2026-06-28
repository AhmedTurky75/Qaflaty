import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type PromoDiscountType = 'Percentage' | 'FixedAmount' | 'FreeShipping';

export interface PromoCodeDto {
  id: string;
  storeId: string;
  code: string;
  description?: string | null;
  discountType: PromoDiscountType;
  value: number;
  minimumOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usageLimitPerCustomer?: number | null;
  timesUsed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavePromoCodeRequest {
  code?: string;
  description?: string | null;
  discountType: PromoDiscountType;
  value: number;
  minimumOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usageLimitPerCustomer?: number | null;
}

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private url(storeId: string): string {
    return `${this.base}/stores/${storeId}/promo-codes`;
  }

  getAll(storeId: string): Observable<PromoCodeDto[]> {
    return this.http.get<PromoCodeDto[]>(this.url(storeId));
  }

  create(storeId: string, body: SavePromoCodeRequest): Observable<PromoCodeDto> {
    return this.http.post<PromoCodeDto>(this.url(storeId), body);
  }

  update(storeId: string, id: string, body: SavePromoCodeRequest): Observable<PromoCodeDto> {
    return this.http.put<PromoCodeDto>(`${this.url(storeId)}/${id}`, body);
  }

  toggle(storeId: string, id: string, isActive: boolean): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${id}/toggle`, { isActive });
  }

  delete(storeId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url(storeId)}/${id}`);
  }
}
