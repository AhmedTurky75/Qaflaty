import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Money } from 'shared';

export interface DashboardStats {
  totalRevenue: Money;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueTrend: number; // Percentage change
  ordersTrend: number; // Percentage change
}

export interface SalesChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  salesCount: number;
  revenue: Money;
  imageUrl?: string;
}

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: Money;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/dashboard`;

  getDashboardStats(storeId: string): Observable<DashboardStats> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<DashboardStats>(`${this.API_URL}/stats`, { params });
  }

  getSalesChartData(storeId: string, days: number = 7): Observable<SalesChartData[]> {
    const params = new HttpParams()
      .set('storeId', storeId)
      .set('days', days.toString());
    return this.http.get<SalesChartData[]>(`${this.API_URL}/sales-chart`, { params });
  }

  getTopProducts(storeId: string, limit: number = 5): Observable<TopProduct[]> {
    const params = new HttpParams()
      .set('storeId', storeId)
      .set('limit', limit.toString());
    return this.http.get<TopProduct[]>(`${this.API_URL}/top-products`, { params });
  }

  getRecentOrders(storeId: string, limit: number = 10): Observable<RecentOrderSummary[]> {
    const params = new HttpParams()
      .set('storeId', storeId)
      .set('count', limit.toString());
    return this.http.get<{ items: RecentOrderSummary[] }>(`${this.API_URL}/recent-orders`, { params }).pipe(
      map(response => response.items)
    );
  }
}
