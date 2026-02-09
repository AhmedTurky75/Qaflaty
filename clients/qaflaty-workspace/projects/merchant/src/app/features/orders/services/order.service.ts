import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OrderDto,
  OrderStatus,
  CancelOrderRequest,
  AddOrderNoteRequest
} from 'shared';

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  orders: OrderDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  ordersByStatus: {
    [key in OrderStatus]: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/orders`;

  getOrders(storeId: string, filters?: OrderFilters): Observable<PaginatedOrders> {
    let params = new HttpParams().set('storeId', storeId);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<PaginatedOrders>(this.API_URL, { params });
  }

  getOrderById(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.API_URL}/${id}`);
  }

  confirmOrder(id: string): Observable<OrderDto> {
    return this.http.patch<OrderDto>(`${this.API_URL}/${id}/confirm`, {});
  }

  processOrder(id: string): Observable<OrderDto> {
    return this.http.patch<OrderDto>(`${this.API_URL}/${id}/process`, {});
  }

  shipOrder(id: string): Observable<OrderDto> {
    return this.http.patch<OrderDto>(`${this.API_URL}/${id}/ship`, {});
  }

  deliverOrder(id: string): Observable<OrderDto> {
    return this.http.patch<OrderDto>(`${this.API_URL}/${id}/deliver`, {});
  }

  cancelOrder(id: string, request: CancelOrderRequest): Observable<OrderDto> {
    return this.http.patch<OrderDto>(`${this.API_URL}/${id}/cancel`, request);
  }

  addOrderNote(id: string, request: AddOrderNoteRequest): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.API_URL}/${id}/notes`, request);
  }

  getOrderStats(storeId: string): Observable<OrderStats> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<OrderStats>(`${this.API_URL}/stats`, { params });
  }
}
