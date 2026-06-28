import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ReturnItemDto {
  productId: string;
  productName: string;
  unitPrice: { amount: number; currency: string };
  quantity: number;
  lineTotal: { amount: number; currency: string };
}

export interface ReturnRequestDto {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Refunded' | 'Cancelled';
  reason: string;
  refundAmount: { amount: number; currency: string };
  merchantNote?: string | null;
  refundTransactionId?: string | null;
  items: ReturnItemDto[];
  createdAt: string;
  resolvedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private url(storeId: string): string {
    return `${this.base}/stores/${storeId}/returns`;
  }

  getReturns(storeId: string, status?: string): Observable<ReturnRequestDto[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ReturnRequestDto[]>(this.url(storeId), { params });
  }

  approve(storeId: string, id: string, merchantNote?: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${id}/approve`, { merchantNote });
  }

  reject(storeId: string, id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${id}/reject`, { reason });
  }

  refund(storeId: string, id: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${id}/refund`, {});
  }
}
