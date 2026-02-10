import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CategoryDto,
  CategoryTreeDto,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from 'shared';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly BASE_URL = environment.apiUrl;

  private storeUrl(storeId: string): string {
    return `${this.BASE_URL}/stores/${storeId}/categories`;
  }

  getCategories(storeId: string): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.storeUrl(storeId));
  }

  getCategoryTree(storeId: string): Observable<CategoryTreeDto[]> {
    return this.http.get<CategoryTreeDto[]>(`${this.storeUrl(storeId)}/tree`);
  }

  getCategoryById(storeId: string, id: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.storeUrl(storeId)}/${id}`);
  }

  createCategory(storeId: string, request: CreateCategoryRequest): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.storeUrl(storeId), request);
  }

  updateCategory(storeId: string, id: string, request: UpdateCategoryRequest): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.storeUrl(storeId)}/${id}`, request);
  }

  updateCategorySortOrder(storeId: string, id: string, sortOrder: number): Observable<CategoryDto> {
    return this.http.patch<CategoryDto>(`${this.storeUrl(storeId)}/${id}/sort`, { sortOrder });
  }

  deleteCategory(storeId: string, id: string): Observable<void> {
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
}
