import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, OrderResponse, OrderTracking } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/storefront/orders`;

  /**
   * Place a new order
   */
  placeOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, request);
  }

  /**
   * Track order by order number
   */
  trackOrder(orderNumber: string): Observable<OrderTracking> {
    return this.http.get<OrderTracking>(`${this.apiUrl}/track/${orderNumber}`);
  }
}
