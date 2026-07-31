import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogConfig
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BlockedPhoneService, BlockedPhoneDto } from '../orders/services/blocked-phone.service';

@Component({
  selector: 'app-blocked-phones',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe, IconComponent, ConfirmDialogComponent],
  templateUrl: './blocked-phones.component.html'
})
export class BlockedPhonesComponent implements OnInit {
  private blockedPhoneService = inject(BlockedPhoneService);
  private transloco = inject(TranslocoService);

  blockedPhones = signal<BlockedPhoneDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  formError = signal<string | null>(null);
  saving = signal(false);
  unblockPending = signal(false);
  dialog = signal<ConfirmDialogConfig | null>(null);
  private pendingUnblock = signal<BlockedPhoneDto | null>(null);

  searchQuery = signal('');

  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  // Add form
  newPhone = signal('');
  newCountryCode = signal('SA');
  newReason = signal('');

  private get storeId(): string {
    return localStorage.getItem('currentStoreId') || '';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.storeId) {
      this.error.set(this.transloco.translate('blockedPhones.noStore'));
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.blockedPhoneService
      .getBlockedPhones(this.storeId, {
        search: this.searchQuery() || undefined,
        page: this.currentPage(),
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (response) => {
          this.blockedPhones.set(response.items);
          this.totalCount.set(response.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || this.transloco.translate('blockedPhones.loadFailed'));
          this.loading.set(false);
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  onBlock(): void {
    const phone = this.newPhone().trim();
    if (!phone) return;

    this.saving.set(true);
    this.formError.set(null);

    this.blockedPhoneService
      .blockPhone(this.storeId, {
        phone,
        countryCode: this.newCountryCode().trim().toUpperCase(),
        reason: this.newReason().trim() || null
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.newPhone.set('');
          this.newReason.set('');
          this.currentPage.set(1);
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(err?.error?.message || this.transloco.translate('blockedPhones.blockFailed'));
        }
      });
  }

  onUnblock(blocked: BlockedPhoneDto): void {
    this.pendingUnblock.set(blocked);
    this.dialog.set({
      title: this.transloco.translate('blockedPhones.unblock'),
      message: this.transloco.translate('blockedPhones.unblockConfirm', { phone: blocked.phone }),
      confirmLabel: this.transloco.translate('blockedPhones.unblock'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'primary',
      icon: 'check-circle'
    });
  }

  onDialogCancelled(): void {
    this.dialog.set(null);
    this.pendingUnblock.set(null);
  }

  onDialogConfirmed(): void {
    const blocked = this.pendingUnblock();
    if (!blocked) return;

    this.unblockPending.set(true);
    this.error.set(null);

    this.blockedPhoneService.unblockPhone(this.storeId, blocked.id).subscribe({
      next: () => {
        this.unblockPending.set(false);
        this.dialog.set(null);
        this.pendingUnblock.set(null);
        this.load();
      },
      error: (err) => {
        this.unblockPending.set(false);
        this.dialog.set(null);
        this.pendingUnblock.set(null);
        this.error.set(err?.error?.message || this.transloco.translate('blockedPhones.unblockFailed'));
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
