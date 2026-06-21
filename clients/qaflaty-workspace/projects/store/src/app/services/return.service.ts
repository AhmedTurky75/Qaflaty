import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReturnItemSelection {
  productId: string;
  quantity: number;
}

export interface ReturnRequestResult {
  id: string;
  orderNumber: string;
  status: string;
  refundAmount: { amount: number; currency: string };
}

@Injectable({ providedIn: 'root' })
export class ReturnService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/storefront/returns`;

  /** Guest return — authorized by the email/phone used on the order. */
  requestGuestReturn(
    orderNumber: string, contact: string, items: ReturnItemSelection[], reason: string
  ): Observable<ReturnRequestResult> {
    return this.http.post<ReturnRequestResult>(`${this.apiUrl}/guest`, {
      orderNumber, contact, items, reason
    });
  }

  /** Signed-in customer return (requires customer auth token). */
  requestReturn(
    orderNumber: string, items: ReturnItemSelection[], reason: string
  ): Observable<ReturnRequestResult> {
    return this.http.post<ReturnRequestResult>(this.apiUrl, { orderNumber, items, reason });
  }
}
