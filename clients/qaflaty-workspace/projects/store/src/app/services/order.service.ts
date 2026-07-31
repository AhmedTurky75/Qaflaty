import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalculateOrderRequest, CreateOrderRequest, OrderCalculation, OrderResponse, OrderTracking } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/storefront/orders`;

  calculateOrder(request: CalculateOrderRequest): Observable<OrderCalculation> {
    return this.http.post<OrderCalculation>(`${this.apiUrl}/calculate`, request);
  }

  placeOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, request);
  }

  trackOrder(orderNumber: string, contact: string): Observable<OrderTracking> {
    const params = new HttpParams().set('contact', contact);
    return this.http.get<OrderTracking>(`${this.apiUrl}/track/${orderNumber}`, { params });
  }

  verifyOrderOtp(orderNumber: string, otpCode: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/${orderNumber}/verify`, { otpCode });
  }

  resendOrderOtp(orderNumber: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${orderNumber}/resend-otp`, {});
  }
}
