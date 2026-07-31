import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { StoreContextService } from '../../core/services/store-context.service';
import { ProductService } from '../products/services/product.service';
import {
  ReviewAdminService,
  ReviewModerationDto,
  ReviewSettingsDto
} from './services/review-admin.service';

interface ManualReviewForm {
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private service = inject(ReviewAdminService);
  private productService = inject(ProductService);
  private transloco = inject(TranslocoService);

  readonly statuses = ['Pending', 'Approved', 'Rejected', 'Hidden'];

  reviews = signal<ReviewModerationDto[]>([]);
  loading = signal(false);
  activeStatus = signal<string>('Pending');
  settings = signal<ReviewSettingsDto | null>(null);
  savingSettings = signal(false);
  settingsSaved = signal(false);

  // Add-review (manual / merchant-authored)
  products = signal<{ id: string; name: string }[]>([]);
  showAddModal = signal(false);
  submitting = signal(false);
  addError = signal<string | null>(null);
  addForm = signal<ManualReviewForm>(this.emptyForm());

  pendingCount = computed(() => this.reviews().filter(r => r.status === 'Pending').length);

  /** Product name in the active language, falling back to the other one, then to the slug. */
  productLabel(review: ReviewModerationDto): string {
    const preferArabic = this.transloco.getActiveLang() === 'ar';
    const primary = preferArabic ? review.productNameAr : review.productName;
    const secondary = preferArabic ? review.productName : review.productNameAr;

    return primary?.trim() || secondary?.trim() || review.productSlug || '';
  }

  private get storeId(): string | null {
    return this.storeContext.currentStoreId();
  }

  ngOnInit(): void {
    this.loadSettings();
    this.load();
  }

  load(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.loading.set(true);
    this.service.getReviews(storeId, { status: this.activeStatus() }).subscribe({
      next: (r) => { this.reviews.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadSettings(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.service.getSettings(storeId).subscribe({
      next: (s) => this.settings.set(s),
      error: () => { /* ignore */ }
    });
  }

  selectStatus(status: string): void {
    this.activeStatus.set(status);
    this.load();
  }

  private act(fn: (storeId: string, id: string) => any, review: ReviewModerationDto): void {
    const storeId = this.storeId;
    if (!storeId) return;
    fn.call(this.service, storeId, review.id).subscribe({ next: () => this.load() });
  }

  approve(r: ReviewModerationDto) { this.act(this.service.approve, r); }
  reject(r: ReviewModerationDto) { this.act(this.service.reject, r); }
  hide(r: ReviewModerationDto) { this.act(this.service.hide, r); }
  pin(r: ReviewModerationDto) { this.act(this.service.pin, r); }
  unpin(r: ReviewModerationDto) { this.act(this.service.unpin, r); }

  saveSettings(): void {
    const storeId = this.storeId;
    const s = this.settings();
    if (!storeId || !s) return;
    this.savingSettings.set(true);
    this.settingsSaved.set(false);
    this.service.updateSettings(storeId, s).subscribe({
      next: () => {
        this.savingSettings.set(false);
        this.settingsSaved.set(true);
        setTimeout(() => this.settingsSaved.set(false), 2500);
      },
      error: () => this.savingSettings.set(false)
    });
  }

  updateSetting<K extends keyof ReviewSettingsDto>(key: K, value: ReviewSettingsDto[K]): void {
    const s = this.settings();
    if (s) this.settings.set({ ...s, [key]: value });
  }

  starArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= rating);
  }

  // ── Add manual review ──

  private emptyForm(): ManualReviewForm {
    return { productId: '', authorName: '', rating: 5, title: '', comment: '' };
  }

  openAddModal(): void {
    this.addForm.set(this.emptyForm());
    this.addError.set(null);
    this.showAddModal.set(true);
    if (!this.products().length) this.loadProducts();
  }

  private loadProducts(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.productService.getProducts(storeId, { limit: 200 }).subscribe({
      next: (res) => this.products.set(res.items.map(p => ({ id: p.id, name: p.name }))),
      error: () => { /* leave empty; the field will show no options */ }
    });
  }

  updateAddField<K extends keyof ManualReviewForm>(key: K, value: ManualReviewForm[K]): void {
    this.addForm.set({ ...this.addForm(), [key]: value });
  }

  submitManualReview(): void {
    const storeId = this.storeId;
    const form = this.addForm();
    if (!storeId) return;
    if (!form.productId || !form.authorName.trim()) {
      this.addError.set('Product and author name are required.');
      return;
    }

    this.submitting.set(true);
    this.addError.set(null);
    this.service.createManualReview(storeId, {
      productId: form.productId,
      authorName: form.authorName.trim(),
      rating: form.rating,
      title: form.title.trim() || undefined,
      comment: form.comment.trim() || undefined
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showAddModal.set(false);
        // Manual reviews are auto-approved — jump to the Approved tab to see it.
        this.activeStatus.set('Approved');
        this.load();
      },
      error: (err) => {
        this.submitting.set(false);
        this.addError.set(err?.error?.message || 'Failed to add review.');
      }
    });
  }
}
