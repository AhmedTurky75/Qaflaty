import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../services/store.service';
import { ColorPickerComponent } from '../components/color-picker/color-picker.component';
import { StoreDto, Currency } from 'shared';

@Component({
  selector: 'app-store-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ColorPickerComponent],
  templateUrl: './store-details.component.html',
  styleUrls: ['./store-details.component.scss']
})
export class StoreDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private storeService = inject(StoreService);

  store = signal<StoreDto | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<'general' | 'branding' | 'delivery'>('general');

  generalForm!: FormGroup;
  brandingForm!: FormGroup;
  deliveryForm!: FormGroup;

  Currency = Currency;

  ngOnInit(): void {
    const storeId = this.route.snapshot.paramMap.get('id');
    if (storeId) {
      this.loadStore(storeId);
    }
  }

  private initializeForms(store: StoreDto): void {
    this.generalForm = this.fb.group({
      name: [store.name, [Validators.required, Validators.minLength(2)]],
      description: [store.description || '', Validators.maxLength(500)]
    });

    this.brandingForm = this.fb.group({
      logoUrl: [store.branding.logoUrl || ''],
      primaryColor: [store.branding.primaryColor, Validators.required]
    });

    this.deliveryForm = this.fb.group({
      deliveryFeeAmount: [store.deliverySettings.deliveryFee.amount, [Validators.required, Validators.min(0)]],
      deliveryFeeCurrency: [store.deliverySettings.deliveryFee.currency],
      freeDeliveryThresholdAmount: [store.deliverySettings.freeDeliveryThreshold?.amount || null, Validators.min(0)],
      freeDeliveryThresholdCurrency: [store.deliverySettings.freeDeliveryThreshold?.currency || Currency.SAR]
    });
  }

  loadStore(storeId: string): void {
    this.loading.set(true);
    this.storeService.getStoreById(storeId).subscribe({
      next: (store) => {
        this.store.set(store);
        this.initializeForms(store);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load store');
        this.loading.set(false);
      }
    });
  }

  onColorChange(color: string): void {
    this.brandingForm.patchValue({ primaryColor: color });
  }

  saveGeneral(): void {
    if (this.generalForm.invalid || !this.store()) return;

    this.saving.set(true);
    this.storeService.updateStore(this.store()!.id, this.generalForm.value).subscribe({
      next: (updatedStore) => {
        this.store.set(updatedStore);
        this.saving.set(false);
        alert('Store information updated successfully!');
      },
      error: (err) => {
        this.saving.set(false);
        alert(`Failed to update store: ${err.message}`);
      }
    });
  }

  saveBranding(): void {
    if (this.brandingForm.invalid || !this.store()) return;

    this.saving.set(true);
    this.storeService.updateBranding(this.store()!.id, this.brandingForm.value).subscribe({
      next: (updatedStore) => {
        this.store.set(updatedStore);
        this.saving.set(false);
        alert('Branding updated successfully!');
      },
      error: (err) => {
        this.saving.set(false);
        alert(`Failed to update branding: ${err.message}`);
      }
    });
  }

  saveDelivery(): void {
    if (this.deliveryForm.invalid || !this.store()) return;

    const formValue = this.deliveryForm.value;
    const request = {
      deliveryFee: {
        amount: formValue.deliveryFeeAmount,
        currency: formValue.deliveryFeeCurrency
      },
      freeDeliveryThreshold: formValue.freeDeliveryThresholdAmount ? {
        amount: formValue.freeDeliveryThresholdAmount,
        currency: formValue.freeDeliveryThresholdCurrency
      } : undefined
    };

    this.saving.set(true);
    this.storeService.updateDeliverySettings(this.store()!.id, request).subscribe({
      next: (updatedStore) => {
        this.store.set(updatedStore);
        this.saving.set(false);
        alert('Delivery settings updated successfully!');
      },
      error: (err) => {
        this.saving.set(false);
        alert(`Failed to update delivery settings: ${err.message}`);
      }
    });
  }

  setTab(tab: 'general' | 'branding' | 'delivery'): void {
    this.activeTab.set(tab);
  }

  getStoreUrl(): string {
    const store = this.store();
    if (!store) return '';
    return store.customDomain || `${store.slug}.qaflaty.com`;
  }
}
