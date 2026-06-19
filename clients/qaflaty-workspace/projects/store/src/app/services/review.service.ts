import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ProductReview,
  ProductReviewList,
  ReviewSortBy,
  SubmitReviewRequest,
  UpdateReviewRequest
} from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/storefront`;

  getReviews(
    productId: string,
    opts: { page?: number; pageSize?: number; sortBy?: ReviewSortBy; stars?: number } = {}
  ): Observable<ProductReviewList> {
    let params = new HttpParams();
    if (opts.page) params = params.set('page', opts.page.toString());
    if (opts.pageSize) params = params.set('pageSize', opts.pageSize.toString());
    if (opts.sortBy) params = params.set('sortBy', opts.sortBy);
    if (opts.stars) params = params.set('stars', opts.stars.toString());
    return this.http.get<ProductReviewList>(`${this.base}/products/${productId}/reviews`, { params });
  }

  /** The authenticated customer's own review (any status), or null. */
  getMyReview(productId: string): Observable<ProductReview | null> {
    return this.http.get<ProductReview | null>(`${this.base}/products/${productId}/reviews/mine`);
  }

  submitReview(productId: string, body: SubmitReviewRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.base}/products/${productId}/reviews`, body);
  }

  updateReview(reviewId: string, body: UpdateReviewRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/reviews/${reviewId}`, body);
  }

  deleteReview(reviewId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/reviews/${reviewId}`);
  }

  voteHelpful(reviewId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/reviews/${reviewId}/helpful`, {});
  }
}
