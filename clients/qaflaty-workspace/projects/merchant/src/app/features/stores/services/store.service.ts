import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  StoreDto,
  CreateStoreRequest,
  UpdateStoreRequest,
  UpdateBrandingRequest,
  UpdateDeliverySettingsRequest
} from 'shared';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/stores`;

  getMyStores(): Observable<StoreDto[]> {
    return this.http.get<StoreDto[]>(this.API_URL);
  }

  getStoreById(id: string): Observable<StoreDto> {
    return this.http.get<StoreDto>(`${this.API_URL}/${id}`);
  }

  createStore(request: CreateStoreRequest): Observable<StoreDto> {
    return this.http.post<StoreDto>(this.API_URL, request);
  }

  updateStore(id: string, request: UpdateStoreRequest): Observable<StoreDto> {
    return this.http.put<StoreDto>(`${this.API_URL}/${id}`, request);
  }

  updateBranding(id: string, request: UpdateBrandingRequest): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/branding`, request);
  }

  updateDeliverySettings(id: string, request: UpdateDeliverySettingsRequest): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/delivery`, request);
  }

  deleteStore(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  checkSlugAvailability(slug: string): Observable<{ available: boolean }> {
    return this.http.post<{ available: boolean }>(`${this.API_URL}/check-slug`, { slug });
  }
}
