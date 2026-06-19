import { Component, inject, signal, computed, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { FeatureService } from '../../services/feature.service';
import { ProductReview, ProductReviewList, ReviewSortBy } from '../../models/review.model';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-reviews.component.html',
  styleUrls: ['./product-reviews.component.css']
})
export class ProductReviewsComponent implements OnInit {
  @Input({ required: true }) productId!: string;

  private reviewService = inject(ReviewService);
  auth = inject(CustomerAuthService);
  features = inject(FeatureService);

  readonly stars = [5, 4, 3, 2, 1];

  data = signal<ProductReviewList | null>(null);
  loading = signal(true);
  page = signal(1);
  sortBy = signal<ReviewSortBy>('recent');
  filterStars = signal<number | null>(null);

  myReview = signal<ProductReview | null>(null);
  showForm = signal(false);

  // form state
  formRating = signal(0);
  formHoverRating = signal(0);
  formTitle = signal('');
  formComment = signal('');
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  summary = computed(() => this.data()?.summary ?? null);
  reviews = computed(() => this.data()?.items ?? []);
  hasMore = computed(() => {
    const d = this.data();
    return !!d && d.page < d.totalPages;
  });

  ngOnInit(): void {
    this.load();
    if (this.auth.isAuthenticated()) {
      this.loadMyReview();
    }
  }

  load(append = false): void {
    this.loading.set(true);
    this.reviewService.getReviews(this.productId, {
      page: this.page(),
      pageSize: 10,
      sortBy: this.sortBy(),
      stars: this.filterStars() ?? undefined
    }).subscribe({
      next: (res) => {
        if (append && this.data()) {
          this.data.set({ ...res, items: [...this.data()!.items, ...res.items] });
        } else {
          this.data.set(res);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMyReview(): void {
    this.reviewService.getMyReview(this.productId).subscribe({
      next: (r) => {
        this.myReview.set(r);
        if (r) {
          this.formRating.set(r.rating);
          this.formTitle.set(r.title ?? '');
          this.formComment.set(r.comment ?? '');
        }
      },
      error: () => { /* not logged in or none */ }
    });
  }

  changeSort(value: string): void {
    this.sortBy.set(value as ReviewSortBy);
    this.page.set(1);
    this.load();
  }

  toggleStarFilter(star: number): void {
    this.filterStars.set(this.filterStars() === star ? null : star);
    this.page.set(1);
    this.load();
  }

  loadMore(): void {
    this.page.update(p => p + 1);
    this.load(true);
  }

  voteHelpful(review: ProductReview): void {
    this.reviewService.voteHelpful(review.id).subscribe({
      next: () => review.helpfulCount++,
      error: () => { /* ignore */ }
    });
  }

  // ---- form ----
  openForm(): void {
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  setRating(n: number): void {
    this.formRating.set(n);
  }

  cancelForm(): void {
    this.showForm.set(false);
    const r = this.myReview();
    if (r) {
      this.formRating.set(r.rating);
      this.formTitle.set(r.title ?? '');
      this.formComment.set(r.comment ?? '');
    } else {
      this.formRating.set(0);
      this.formTitle.set('');
      this.formComment.set('');
    }
  }

  submit(): void {
    if (this.formRating() < 1) {
      this.errorMessage.set('Please select a star rating.');
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    const existing = this.myReview();
    const body = {
      rating: this.formRating(),
      title: this.formTitle().trim() || null,
      comment: this.formComment().trim() || null
    };

    const obs = existing
      ? this.reviewService.updateReview(existing.id, body)
      : this.reviewService.submitReview(this.productId, body);

    obs.subscribe({
      next: () => {
        this.submitting.set(false);
        this.showForm.set(false);
        this.page.set(1);
        this.load();
        this.loadMyReview();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not save your review. Please try again.');
      }
    });
  }

  deleteMyReview(): void {
    const existing = this.myReview();
    if (!existing) return;
    this.submitting.set(true);
    this.reviewService.deleteReview(existing.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.myReview.set(null);
        this.formRating.set(0);
        this.formTitle.set('');
        this.formComment.set('');
        this.showForm.set(false);
        this.page.set(1);
        this.load();
      },
      error: () => this.submitting.set(false)
    });
  }

  starArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= Math.round(rating));
  }
}
