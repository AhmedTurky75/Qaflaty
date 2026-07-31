import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BlockedPhoneDto {
  id: string;
  phone: string;
  countryCode: string | null;
  reason: string | null;
  blockedBy: string;
  sourceOrderId: string | null;
  sourceOrderNumber: string | null;
  blockedAt: string;
}

export interface PaginatedBlockedPhones {
  items: BlockedPhoneDto[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({ providedIn: 'root' })
export class BlockedPhoneService {
  private http = inject(HttpClient);

  private baseUrl(storeId: string): string {
    return `${environment.apiUrl}/stores/${storeId}/blocked-phones`;
  }

  getBlockedPhones(
    storeId: string,
    options?: { search?: string; page?: number; pageSize?: number }
  ): Observable<PaginatedBlockedPhones> {
    let params = new HttpParams();

    if (options?.search) {
      params = params.set('search', options.search);
    }
    if (options?.page) {
      params = params.set('page', options.page.toString());
    }
    if (options?.pageSize) {
      params = params.set('pageSize', options.pageSize.toString());
    }

    return this.http.get<PaginatedBlockedPhones>(this.baseUrl(storeId), { params });
  }

  blockPhone(
    storeId: string,
    request: { phone: string; countryCode: string; reason?: string | null }
  ): Observable<BlockedPhoneDto> {
    return this.http.post<BlockedPhoneDto>(this.baseUrl(storeId), request);
  }

  /** Blocks the number behind an order; the phone is resolved server-side from the order. */
  blockPhoneFromOrder(storeId: string, orderId: string, reason?: string | null): Observable<BlockedPhoneDto> {
    return this.http.post<BlockedPhoneDto>(`${this.baseUrl(storeId)}/from-order/${orderId}`, { reason });
  }

  /**
   * Blocks a customer's number store-wide (not tied to one order); the phone is resolved
   * server-side from the customer.
   */
  blockPhoneFromCustomer(storeId: string, customerId: string, reason?: string | null): Observable<BlockedPhoneDto> {
    return this.http.post<BlockedPhoneDto>(`${this.baseUrl(storeId)}/from-customer/${customerId}`, { reason });
  }

  unblockPhone(storeId: string, blockedPhoneId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(storeId)}/${blockedPhoneId}`);
  }
}
