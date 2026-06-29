import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../core/services/store-context.service';
import {
  PromoCodeService,
  PromoCodeDto,
  PromoDiscountType,
  SavePromoCodeRequest
} from './services/promo-code.service';

interface PromoForm {
  code: string;
  description: string;
  discountType: PromoDiscountType;
  value: number | null;
  minimumOrderAmount: number | null;
  maxDiscountAmount: number | null;
  startsAt: string;
  expiresAt: string;
  usageLimit: number | null;
  usageLimitPerCustomer: number | null;
}

@Component({
  selector: 'app-promo-codes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promo-codes.component.html',
  styleUrls: ['./promo-codes.component.scss']
})
export class PromoCodesComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private service = inject(PromoCodeService);

  readonly discountTypes: PromoDiscountType[] = ['Percentage', 'FixedAmount', 'FreeShipping'];

  codes = signal<PromoCodeDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  showForm = signal(false);
  editingId = signal<string | null>(null);
  form = signal<PromoForm>(this.emptyForm());

  private get storeId(): string | null {
    return this.storeContext.currentStoreId();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.loading.set(true);
    this.service.getAll(storeId).subscribe({
      next: (c) => { this.codes.set(c); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.set(this.emptyForm());
    this.error.set(null);
    this.showForm.set(true);
  }

  startEdit(c: PromoCodeDto): void {
    this.editingId.set(c.id);
    this.form.set({
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType,
      value: c.value,
      minimumOrderAmount: c.minimumOrderAmount ?? null,
      maxDiscountAmount: c.maxDiscountAmount ?? null,
      startsAt: c.startsAt ? c.startsAt.substring(0, 10) : '',
      expiresAt: c.expiresAt ? c.expiresAt.substring(0, 10) : '',
      usageLimit: c.usageLimit ?? null,
      usageLimitPerCustomer: c.usageLimitPerCustomer ?? null
    });
    this.error.set(null);
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.error.set(null);
  }

  save(): void {
    const storeId = this.storeId;
    if (!storeId) return;
    const f = this.form();
    const body: SavePromoCodeRequest = {
      code: f.code?.trim(),
      description: f.description?.trim() || null,
      discountType: f.discountType,
      value: f.discountType === 'FreeShipping' ? 0 : Number(f.value ?? 0),
      minimumOrderAmount: f.minimumOrderAmount,
      maxDiscountAmount: f.discountType === 'Percentage' ? f.maxDiscountAmount : null,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
      usageLimit: f.usageLimit,
      usageLimitPerCustomer: f.usageLimitPerCustomer
    };

    this.saving.set(true);
    this.error.set(null);
    const id = this.editingId();
    const req = id
      ? this.service.update(storeId, id, body)
      : this.service.create(storeId, body);

    req.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? 'Could not save the promo code.');
      }
    });
  }

  toggle(c: PromoCodeDto): void {
    const storeId = this.storeId;
    if (!storeId) return;
    this.service.toggle(storeId, c.id, !c.isActive).subscribe({ next: () => this.load() });
  }

  remove(c: PromoCodeDto): void {
    const storeId = this.storeId;
    if (!storeId) return;
    if (!confirm(`Delete promo code "${c.code}"?`)) return;
    this.service.delete(storeId, c.id).subscribe({ next: () => this.load() });
  }

  updateForm<K extends keyof PromoForm>(key: K, value: PromoForm[K]): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  describeDiscount(c: PromoCodeDto): string {
    switch (c.discountType) {
      case 'Percentage': return `${c.value}% off`;
      case 'FixedAmount': return `${c.value} off`;
      case 'FreeShipping': return 'Free shipping';
    }
  }

  private emptyForm(): PromoForm {
    return {
      code: '',
      description: '',
      discountType: 'Percentage',
      value: null,
      minimumOrderAmount: null,
      maxDiscountAmount: null,
      startsAt: '',
      expiresAt: '',
      usageLimit: null,
      usageLimitPerCustomer: null
    };
  }
}
