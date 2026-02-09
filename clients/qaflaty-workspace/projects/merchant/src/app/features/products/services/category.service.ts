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
  private readonly API_URL = `${environment.apiUrl}/categories`;

  getCategories(storeId: string): Observable<CategoryDto[]> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<CategoryDto[]>(this.API_URL, { params });
  }

  getCategoryTree(storeId: string): Observable<CategoryTreeDto[]> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<CategoryTreeDto[]>(`${this.API_URL}/tree`, { params });
  }

  getCategoryById(id: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.API_URL}/${id}`);
  }

  createCategory(storeId: string, request: CreateCategoryRequest): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.API_URL, { ...request, storeId });
  }

  updateCategory(id: string, request: UpdateCategoryRequest): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.API_URL}/${id}`, request);
  }

  updateCategorySortOrder(id: string, sortOrder: number): Observable<CategoryDto> {
    return this.http.patch<CategoryDto>(`${this.API_URL}/${id}/sort`, { sortOrder });
  }

  deleteCategory(id: string): Observable<void> {
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
