import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ActiveCartItem {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
}

export interface ActiveCart {
  cartId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: ActiveCartItem[];
  totalItems: number;
  lastUpdated: string;
}

@Injectable({ providedIn: 'root' })
export class ActiveCartsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/carts`;

  getActiveCarts(storeId: string): Observable<ActiveCart[]> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<ActiveCart[]>(`${this.API_URL}/active`, { params });
  }
}
