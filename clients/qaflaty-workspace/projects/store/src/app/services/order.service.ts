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

  placeOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, request);
  }

  trackOrder(orderNumber: string): Observable<OrderTracking> {
    return this.http.get<OrderTracking>(`${this.apiUrl}/track/${orderNumber}`);
  }

  verifyOrderOtp(orderNumber: string, otpCode: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/${orderNumber}/verify`, { otpCode });
  }

  resendOrderOtp(orderNumber: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${orderNumber}/resend-otp`, {});
  }
}
