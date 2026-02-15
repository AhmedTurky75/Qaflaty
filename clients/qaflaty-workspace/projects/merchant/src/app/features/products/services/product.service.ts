import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProductDto,
  CreateProductRequest,
  UpdateProductRequest,
  ProductStatus,
  ProductWithVariantsDto,
  AddVariantOptionRequest,
  AddProductVariantRequest,
  UpdateProductVariantRequest,
  ProductVariantDto,
  AdjustInventoryRequest,
  InventoryMovementDto
} from 'shared';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  items: ProductDto[];
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
  private readonly BASE_URL = environment.apiUrl;

  private storeUrl(storeId: string): string {
    return `${this.BASE_URL}/stores/${storeId}/products`;
  }

  getProducts(storeId: string, filters?: ProductFilters): Observable<PaginatedProducts> {
    let params = new HttpParams();

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

    return this.http.get<PaginatedProducts>(this.storeUrl(storeId), { params });
  }

  getProductById(storeId: string, id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.storeUrl(storeId)}/${id}`);
  }

  createProduct(storeId: string, request: CreateProductRequest): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.storeUrl(storeId), request);
  }

  updateProduct(storeId: string, id: string, request: UpdateProductRequest): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.storeUrl(storeId)}/${id}`, request);
  }

  activateProduct(storeId: string, id: string): Observable<void> {
    return this.http.patch<void>(`${this.storeUrl(storeId)}/${id}/activate`, {});
  }

  deactivateProduct(storeId: string, id: string): Observable<void> {
    return this.http.patch<void>(`${this.storeUrl(storeId)}/${id}/deactivate`, {});
  }

  deleteProduct(storeId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.storeUrl(storeId)}/${id}`);
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // ============ Variant Management ============

  /**
   * Get product with all variant options and variants
   */
  getProductWithVariants(storeId: string, productId: string): Observable<ProductWithVariantsDto> {
    return this.http.get<ProductWithVariantsDto>(`${this.storeUrl(storeId)}/${productId}/variants`);
  }

  /**
   * Add a new variant option (e.g., Color, Size)
   */
  addVariantOption(storeId: string, productId: string, request: AddVariantOptionRequest): Observable<ProductWithVariantsDto> {
    return this.http.post<ProductWithVariantsDto>(
      `${this.storeUrl(storeId)}/${productId}/variant-options`,
      request
    );
  }

  /**
   * Add a new variant combination
   */
  addVariant(storeId: string, productId: string, request: AddProductVariantRequest): Observable<ProductVariantDto> {
    return this.http.post<ProductVariantDto>(
      `${this.storeUrl(storeId)}/${productId}/variants`,
      request
    );
  }

  /**
   * Update an existing variant
   */
  updateVariant(storeId: string, productId: string, variantId: string, request: UpdateProductVariantRequest): Observable<ProductVariantDto> {
    return this.http.put<ProductVariantDto>(
      `${this.storeUrl(storeId)}/${productId}/variants/${variantId}`,
      request
    );
  }

  /**
   * Adjust variant inventory
   */
  adjustVariantInventory(storeId: string, productId: string, variantId: string, request: AdjustInventoryRequest): Observable<void> {
    return this.http.post<void>(
      `${this.storeUrl(storeId)}/${productId}/variants/${variantId}/adjust-inventory`,
      request
    );
  }

  /**
   * Get inventory history for a product
   */
  getInventoryHistory(storeId: string, productId: string): Observable<InventoryMovementDto[]> {
    return this.http.get<InventoryMovementDto[]>(
      `${this.storeUrl(storeId)}/${productId}/inventory-history`
    );
  }
}
