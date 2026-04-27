import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  StoreConfigurationDto,
  UpdateStoreConfigurationRequest,
  PageConfigurationDto,
  UpdatePageConfigurationRequest,
  CreateCustomPageRequest,
  UpdateSectionsRequest,
  FaqItemDto,
  CreateFaqItemRequest,
  UpdateFaqItemRequest,
  PaymentMethodAdjustment,
  PaymentMethodOptionDto,
  SetPaymentMethodAdjustmentsRequest,
  UpdateSearchSettingsRequest,
  DeliveryZoneDto,
  UpsertDeliveryZoneRequest,
  ProductPropertyDefinitionDto,
  CreateProductPropertyDefinitionRequest,
  UpdateProductPropertyDefinitionRequest,
} from 'shared';

@Injectable({
  providedIn: 'root'
})
export class BuilderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ── Store Configuration ──────────────────────────────────────────────────
  getConfiguration(storeId: string): Observable<StoreConfigurationDto> {
    return this.http.get<StoreConfigurationDto>(`${this.apiUrl}/stores/${storeId}/configuration`);
  }

  updateConfiguration(storeId: string, req: UpdateStoreConfigurationRequest): Observable<StoreConfigurationDto> {
    return this.http.put<StoreConfigurationDto>(`${this.apiUrl}/stores/${storeId}/configuration`, req);
  }

  // ── Pages ────────────────────────────────────────────────────────────────
  getPages(storeId: string): Observable<PageConfigurationDto[]> {
    return this.http.get<PageConfigurationDto[]>(`${this.apiUrl}/stores/${storeId}/pages`);
  }

  updatePage(storeId: string, pageId: string, req: UpdatePageConfigurationRequest): Observable<PageConfigurationDto> {
    return this.http.put<PageConfigurationDto>(`${this.apiUrl}/stores/${storeId}/pages/${pageId}`, req);
  }

  createCustomPage(storeId: string, req: CreateCustomPageRequest): Observable<PageConfigurationDto> {
    return this.http.post<PageConfigurationDto>(`${this.apiUrl}/stores/${storeId}/pages/custom`, req);
  }

  deleteCustomPage(storeId: string, pageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/stores/${storeId}/pages/${pageId}`);
  }

  updateSections(storeId: string, pageId: string, req: UpdateSectionsRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/stores/${storeId}/pages/${pageId}/sections`, req);
  }

  // ── FAQ ──────────────────────────────────────────────────────────────────
  getFaqItems(storeId: string): Observable<FaqItemDto[]> {
    return this.http.get<FaqItemDto[]>(`${this.apiUrl}/stores/${storeId}/faq`);
  }

  createFaqItem(storeId: string, req: CreateFaqItemRequest): Observable<FaqItemDto> {
    return this.http.post<FaqItemDto>(`${this.apiUrl}/stores/${storeId}/faq`, req);
  }

  updateFaqItem(storeId: string, id: string, req: UpdateFaqItemRequest): Observable<FaqItemDto> {
    return this.http.put<FaqItemDto>(`${this.apiUrl}/stores/${storeId}/faq/${id}`, req);
  }

  deleteFaqItem(storeId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/stores/${storeId}/faq/${id}`);
  }

  // ── Payment Method Options (catalog) ────────────────────────────────────
  getPaymentMethodOptions(): Observable<PaymentMethodOptionDto[]> {
    return this.http.get<PaymentMethodOptionDto[]>(`${this.apiUrl}/payment-methods/options`);
  }

  // ── Payment Method Adjustments ───────────────────────────────────────────
  setPaymentAdjustments(storeId: string, req: SetPaymentMethodAdjustmentsRequest): Observable<void> {
    // API expects flat array, not wrapped object
    return this.http.put<void>(`${this.apiUrl}/stores/${storeId}/payment-adjustments`, req.adjustments);
  }

  // ── Search Settings ──────────────────────────────────────────────────────
  updateSearchSettings(storeId: string, req: UpdateSearchSettingsRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/stores/${storeId}/search-settings`, req);
  }

  // ── Delivery Zones ───────────────────────────────────────────────────────
  getDeliveryZones(storeId: string): Observable<DeliveryZoneDto[]> {
    return this.http.get<DeliveryZoneDto[]>(`${this.apiUrl}/stores/${storeId}/delivery-zones`);
  }

  upsertDeliveryZone(storeId: string, req: UpsertDeliveryZoneRequest): Observable<DeliveryZoneDto> {
    return this.http.put<DeliveryZoneDto>(`${this.apiUrl}/stores/${storeId}/delivery-zones`, req);
  }

  // ── Product Property Definitions ─────────────────────────────────────────
  getProductPropertyDefinitions(storeId: string): Observable<ProductPropertyDefinitionDto[]> {
    return this.http.get<ProductPropertyDefinitionDto[]>(`${this.apiUrl}/stores/${storeId}/product-properties`);
  }

  createProductPropertyDefinition(storeId: string, req: CreateProductPropertyDefinitionRequest): Observable<ProductPropertyDefinitionDto> {
    return this.http.post<ProductPropertyDefinitionDto>(`${this.apiUrl}/stores/${storeId}/product-properties`, req);
  }

  updateProductPropertyDefinition(storeId: string, definitionId: string, req: UpdateProductPropertyDefinitionRequest): Observable<ProductPropertyDefinitionDto> {
    return this.http.put<ProductPropertyDefinitionDto>(`${this.apiUrl}/stores/${storeId}/product-properties/${definitionId}`, req);
  }

  deleteProductPropertyDefinition(storeId: string, definitionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/stores/${storeId}/product-properties/${definitionId}`);
  }
}
