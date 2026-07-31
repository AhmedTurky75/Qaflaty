import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RelatedProductSummary } from './related-products.service';

export interface DownsellSettings {
  enabled: boolean;
  maxShowsPerSession: number;
  minIntervalSeconds: number;
  excludeOutOfStock: boolean;
}

export type DownsellTriggerType = 'ExitIntentPdp' | 'DwellTimePdp' | 'CartItemRemoved' | 'CartInactivity';
export type DownsellSurface = 'ProductDetails' | 'Cart';

export interface DownsellTriggerRule {
  triggerType: DownsellTriggerType;
  surface: DownsellSurface;
  thresholdSeconds: number | null;
  isEnabled: boolean;
  priority: number;
}

export interface DownsellOffer {
  downsellProducts: RelatedProductSummary[];
  promoCodeId: string | null;
  promoCode: string | null;
  isEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class DownsellService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private url(storeId: string): string {
    return `${this.base}/stores/${storeId}/downsell`;
  }

  getSettings(storeId: string): Observable<DownsellSettings> {
    return this.http.get<DownsellSettings>(`${this.url(storeId)}/settings`);
  }

  setSettings(storeId: string, settings: DownsellSettings): Observable<void> {
    return this.http.put<void>(`${this.url(storeId)}/settings`, settings);
  }

  getTriggerRules(storeId: string): Observable<DownsellTriggerRule[]> {
    return this.http.get<DownsellTriggerRule[]>(`${this.url(storeId)}/trigger-rules`);
  }

  setTriggerRules(storeId: string, rules: DownsellTriggerRule[]): Observable<void> {
    return this.http.put<void>(`${this.url(storeId)}/trigger-rules`, { rules });
  }

  getOffer(storeId: string, productId: string): Observable<DownsellOffer> {
    return this.http.get<DownsellOffer>(`${this.url(storeId)}/products/${productId}/offer`);
  }

  setOffer(
    storeId: string, productId: string,
    downsellProductIds: string[], promoCodeId: string | null, isEnabled: boolean
  ): Observable<void> {
    return this.http.put<void>(`${this.url(storeId)}/products/${productId}/offer`,
      { downsellProductIds, promoCodeId, isEnabled });
  }
}
