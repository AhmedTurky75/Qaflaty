import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ReviewMediaDto {
  url: string;
  type: 'Image' | 'Video';
  sortOrder: number;
}

export interface ReviewModerationDto {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Hidden';
  isVerifiedPurchase: boolean;
  isPinned: boolean;
  helpfulCount: number;
  createdAt: string;
  media: ReviewMediaDto[];
}

export interface ReviewSettingsDto {
  reviewsEnabled: boolean;
  requirePurchase: boolean;
  autoApprove: boolean;
  allowEditing: boolean;
}

export interface CreateManualReviewRequest {
  productId: string;
  authorName: string;
  rating: number;
  title?: string;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewAdminService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private url(storeId: string): string {
    return `${this.base}/stores/${storeId}/reviews`;
  }

  getReviews(storeId: string, opts: { productId?: string; status?: string } = {}): Observable<ReviewModerationDto[]> {
    let params = new HttpParams();
    if (opts.productId) params = params.set('productId', opts.productId);
    if (opts.status) params = params.set('status', opts.status);
    return this.http.get<ReviewModerationDto[]>(this.url(storeId), { params });
  }

  /** Create a merchant-authored (manual) review; returns the new review id. */
  createManualReview(storeId: string, body: CreateManualReviewRequest): Observable<string> {
    return this.http.post<string>(this.url(storeId), body);
  }

  approve(storeId: string, reviewId: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${reviewId}/approve`, {});
  }
  reject(storeId: string, reviewId: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${reviewId}/reject`, {});
  }
  hide(storeId: string, reviewId: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${reviewId}/hide`, {});
  }
  pin(storeId: string, reviewId: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${reviewId}/pin`, {});
  }
  unpin(storeId: string, reviewId: string): Observable<void> {
    return this.http.post<void>(`${this.url(storeId)}/${reviewId}/unpin`, {});
  }

  getSettings(storeId: string): Observable<ReviewSettingsDto> {
    return this.http.get<ReviewSettingsDto>(`${this.url(storeId)}/settings`);
  }
  updateSettings(storeId: string, settings: ReviewSettingsDto): Observable<void> {
    return this.http.put<void>(`${this.url(storeId)}/settings`, settings);
  }
}
