import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProductDto,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateProductPricingRequest,
  UpdateProductInventoryRequest,
  ProductStatus
} from 'shared';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  products: ProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/products`;

  getProducts(storeId: string, filters?: ProductFilters): Observable<PaginatedProducts> {
    let params = new HttpParams().set('storeId', storeId);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<PaginatedProducts>(this.API_URL, { params });
  }

  getProductById(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.API_URL}/${id}`);
  }

  createProduct(storeId: string, request: CreateProductRequest): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.API_URL, { ...request, storeId });
  }

  updateProduct(id: string, request: UpdateProductRequest): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.API_URL}/${id}`, request);
  }

  updateProductPricing(id: string, request: UpdateProductPricingRequest): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.API_URL}/${id}/pricing`, request);
  }

  updateProductInventory(id: string, request: UpdateProductInventoryRequest): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.API_URL}/${id}/inventory`, request);
  }

  updateProductStatus(id: string, status: ProductStatus): Observable<ProductDto> {
    return this.http.patch<ProductDto>(`${this.API_URL}/${id}/status`, { status });
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
