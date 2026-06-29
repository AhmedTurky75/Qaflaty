import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../core/services/store-context.service';
import {
  ReviewAdminService,
  ReviewModerationDto,
  ReviewSettingsDto
} from './services/review-admin.service';

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

  readonly statuses = ['Pending', 'Approved', 'Rejected', 'Hidden'];

  reviews = signal<ReviewModerationDto[]>([]);
  loading = signal(false);
  activeStatus = signal<string>('Pending');
  settings = signal<ReviewSettingsDto | null>(null);
  savingSettings = signal(false);
  settingsSaved = signal(false);

  pendingCount = computed(() => this.reviews().filter(r => r.status === 'Pending').length);

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
}
