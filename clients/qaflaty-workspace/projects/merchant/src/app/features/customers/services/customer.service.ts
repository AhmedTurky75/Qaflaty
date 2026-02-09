import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CustomerDto,
  CustomerDetailDto,
  CustomerFilters,
  PaginatedCustomers,
  UpdateCustomerNotesRequest,
  OrderDto
} from 'shared';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/customers`;

  getCustomers(storeId: string, filters?: CustomerFilters): Observable<PaginatedCustomers> {
    let params = new HttpParams().set('storeId', storeId);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters?.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<PaginatedCustomers>(this.API_URL, { params });
  }

  getCustomerById(id: string): Observable<CustomerDto> {
    return this.http.get<CustomerDto>(`${this.API_URL}/${id}`);
  }

  getCustomerOrders(customerId: string): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.API_URL}/${customerId}/orders`);
  }

  updateCustomerNotes(customerId: string, request: UpdateCustomerNotesRequest): Observable<CustomerDto> {
    return this.http.put<CustomerDto>(`${this.API_URL}/${customerId}/notes`, request);
  }
}
