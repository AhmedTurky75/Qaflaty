import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductFilter, PaginatedProducts } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/storefront/products`;

  /**
   * Get all products with filters
   */
  getProducts(filter?: ProductFilter): Observable<PaginatedProducts> {
    let params = new HttpParams();

    if (filter) {
      if (filter.categoryId) {
        params = params.set('categoryId', filter.categoryId);
      }
      if (filter.search) {
        params = params.set('search', filter.search);
      }
      if (filter.sortBy) {
        params = params.set('sortBy', filter.sortBy);
      }
      if (filter.page) {
        params = params.set('page', filter.page.toString());
      }
      if (filter.pageSize) {
        params = params.set('pageSize', filter.pageSize.toString());
      }
    }

    return this.http.get<PaginatedProducts>(this.apiUrl, { params });
  }

  /**
   * Get product by slug
   */
  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${slug}`);
  }

  /**
   * Get featured products (first page, sorted by newest)
   */
  getFeaturedProducts(limit: number = 8): Observable<PaginatedProducts> {
    return this.getProducts({
      sortBy: 'Newest' as any,
      page: 1,
      pageSize: limit
    });
  }
}
