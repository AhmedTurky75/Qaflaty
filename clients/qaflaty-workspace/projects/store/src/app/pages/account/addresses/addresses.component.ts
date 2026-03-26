import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService, CustomerAddress } from '../../../services/customer-auth.service';
import { LocationPickerComponent, PickedLocation } from '../../../components/shared/location-picker.component';

interface LocationItem { id: number; name: string; }

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LocationPickerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">عناويني</h2>
              <p class="mt-1 text-sm text-gray-600">إدارة عناوين الشحن والتوصيل</p>
            </div>
            <button type="button" (click)="openAddForm()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg class="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              إضافة عنوان جديد
            </button>
          </div>
        </div>

        @if (successMessage()) {
          <div class="mb-4 rounded-md bg-green-50 p-4">
            <p class="text-sm font-medium text-green-800">{{ successMessage() }}</p>
          </div>
        }
        @if (errorMessage()) {
          <div class="mb-4 rounded-md bg-red-50 p-4">
            <p class="text-sm font-medium text-red-800">{{ errorMessage() }}</p>
          </div>
        }

        <!-- Add / Edit Form -->
        @if (showForm()) {
          <div class="mb-6 bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ editingLabel() ? 'تعديل العنوان' : 'إضافة عنوان جديد' }}
            </h3>
            <form [formGroup]="addressForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label for="label" class="block text-sm font-medium text-gray-700">
                  اسم العنوان <span class="text-red-500">*</span>
                </label>
                <input id="label" type="text" formControlName="label" placeholder="المنزل، العمل، إلخ"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                @if (addressForm.get('label')?.invalid && addressForm.get('label')?.touched) {
                  <p class="mt-1 text-sm text-red-600">اسم العنوان مطلوب</p>
                }
              </div>

              <!-- Country dropdown -->
              <div>
                <label for="countryId" class="block text-sm font-medium text-gray-700">
                  الدولة <span class="text-red-500">*</span>
                </label>
                @if (countriesLoading()) {
                  <p class="mt-1 text-sm text-gray-500">جاري التحميل...</p>
                } @else {
                  <select id="countryId" formControlName="countryId" (change)="onCountryChange()"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="">اختر الدولة</option>
                    @for (c of countries(); track c.id) {
                      <option [value]="c.id">{{ c.name }}</option>
                    }
                  </select>
                }
                @if (addressForm.get('countryId')?.invalid && addressForm.get('countryId')?.touched) {
                  <p class="mt-1 text-sm text-red-600">يرجى اختيار الدولة</p>
                }
              </div>

              <!-- City dropdown -->
              <div>
                <label for="city" class="block text-sm font-medium text-gray-700">
                  المدينة <span class="text-red-500">*</span>
                </label>
                @if (citiesLoading()) {
                  <p class="mt-1 text-sm text-gray-500">جاري التحميل...</p>
                } @else {
                  <select id="city" formControlName="city"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    [attr.disabled]="cities().length === 0 ? true : null">
                    <option value="">اختر المدينة</option>
                    @for (c of cities(); track c.id) {
                      <option [value]="c.name">{{ c.name }}</option>
                    }
                  </select>
                }
                @if (addressForm.get('city')?.invalid && addressForm.get('city')?.touched) {
                  <p class="mt-1 text-sm text-red-600">يرجى اختيار المدينة</p>
                }
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="street" class="block text-sm font-medium text-gray-700">
                    الشارع <span class="text-red-500">*</span>
                  </label>
                  <input id="street" type="text" formControlName="street"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  @if (addressForm.get('street')?.invalid && addressForm.get('street')?.touched) {
                    <p class="mt-1 text-sm text-red-600">الشارع مطلوب</p>
                  }
                </div>

                <div>
                  <label for="state" class="block text-sm font-medium text-gray-700">المنطقة</label>
                  <input id="state" type="text" formControlName="state"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label for="postalCode" class="block text-sm font-medium text-gray-700">الرمز البريدي</label>
                  <input id="postalCode" type="text" formControlName="postalCode"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </div>

              <div class="flex items-center">
                <input id="isDefault" type="checkbox" formControlName="isDefault"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label for="isDefault" class="mr-2 block text-sm text-gray-900">تعيين كعنوان افتراضي</label>
              </div>

              <!-- Map Location Picker -->
              <div class="pt-2">
                <app-location-picker
                  [latitude]="pickedLocation()?.latitude"
                  [longitude]="pickedLocation()?.longitude"
                  (locationPicked)="onLocationPicked($event)">
                </app-location-picker>
                @if (pickedLocation()) {
                  <p class="mt-1 text-xs text-green-700 font-medium">
                    ✓ تم تحديد الموقع على الخريطة
                  </p>
                }
              </div>

              <div class="flex gap-3 pt-4">
                <button type="submit" [disabled]="addressForm.invalid || isLoading() || !pickedLocation()"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ isLoading() ? 'جاري الحفظ...' : (editingLabel() ? 'حفظ التعديلات' : 'حفظ العنوان') }}
                </button>
                <button type="button" (click)="cancelForm()" [disabled]="isLoading()"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Addresses List -->
        @if (addresses().length === 0) {
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">لا توجد عناوين</h3>
            <p class="mt-1 text-sm text-gray-500">ابدأ بإضافة عنوان الشحن الخاص بك</p>
            <div class="mt-6">
              <button type="button" (click)="openAddForm()"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                إضافة عنوان
              </button>
            </div>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (address of addresses(); track address.label) {
              <div class="bg-white shadow rounded-lg p-6 relative">
                @if (address.isDefault) {
                  <span class="absolute top-4 left-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    افتراضي
                  </span>
                }
                <h3 class="text-lg font-medium text-gray-900 mb-3">{{ address.label }}</h3>
                <div class="text-sm text-gray-600 space-y-1">
                  <p>{{ address.street }}</p>
                  <p>{{ address.city }}@if (address.state) {، {{ address.state }}}</p>
                  @if (address.postalCode) { <p>{{ address.postalCode }}</p> }
                  <p>{{ address.country }}</p>
                  @if (address.latitude && address.longitude) {
                    <p class="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <svg class="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      موقع محدد على الخريطة
                    </p>
                  }
                </div>
                <div class="mt-4 flex gap-3">
                  <button type="button" (click)="openEditForm(address)"
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    تعديل
                  </button>
                  @if (addresses().length > 1 || !address.isDefault) {
                    <button type="button" (click)="deleteAddress(address)"
                      class="text-sm text-red-600 hover:text-red-800 font-medium">
                      حذف
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Back Link -->
        <div class="mt-6">
          <a routerLink="/account/profile" class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
            <svg class="ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            العودة إلى الملف الشخصي
          </a>
        </div>
      </div>
    </div>
  `
})
export class AddressesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(CustomerAuthService);
  private readonly router = inject(Router);
  private readonly locations = this.authService.getLocations();

  readonly customer = this.authService.customer;
  readonly addresses = signal<CustomerAddress[]>([]);
  readonly showForm = signal(false);
  readonly editingLabel = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly pickedLocation = signal<PickedLocation | null>(null);

  readonly countries = signal<LocationItem[]>([]);
  readonly cities = signal<LocationItem[]>([]);
  readonly countriesLoading = signal(false);
  readonly citiesLoading = signal(false);

  addressForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(50)]],
    countryId: ['', [Validators.required]],
    city: ['', [Validators.required]],
    street: ['', [Validators.required, Validators.maxLength(200)]],
    state: ['', [Validators.maxLength(100)]],
    postalCode: ['', [Validators.maxLength(20)]],
    isDefault: [false]
  });

  ngOnInit(): void {
    const customer = this.customer();
    if (!customer) {
      this.router.navigate(['/account/login']);
      return;
    }
    this.addresses.set(customer.addresses || []);
    this.loadCountries();
  }

  private loadCountries(): void {
    this.countriesLoading.set(true);
    this.locations.countries().subscribe({
      next: (data) => { this.countries.set(data); this.countriesLoading.set(false); },
      error: () => this.countriesLoading.set(false)
    });
  }

  onCountryChange(): void {
    const countryId = this.addressForm.get('countryId')?.value;
    this.addressForm.patchValue({ city: '' });
    this.cities.set([]);
    if (!countryId) return;
    this.citiesLoading.set(true);
    this.locations.cities(Number(countryId)).subscribe({
      next: (data) => { this.cities.set(data); this.citiesLoading.set(false); },
      error: () => this.citiesLoading.set(false)
    });
  }

  onLocationPicked(loc: PickedLocation | null): void {
    this.pickedLocation.set(loc);
  }

  openAddForm(): void {
    this.editingLabel.set(null);
    this.showForm.set(true);
    this.addressForm.reset({ isDefault: false });
    this.cities.set([]);
    this.pickedLocation.set(null);
    this.clearMessages();
  }

  openEditForm(address: CustomerAddress): void {
    this.editingLabel.set(address.label);
    this.showForm.set(true);
    this.clearMessages();
    this.pickedLocation.set({ latitude: address.latitude, longitude: address.longitude });

    // Try to match the country by name to get the id for the dropdown
    const matchedCountry = this.countries().find(c => c.name === address.country);
    const countryId = matchedCountry?.id ?? '';

    this.addressForm.patchValue({
      label: address.label,
      countryId: countryId,
      city: address.city,
      street: address.street,
      state: address.state || '',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault
    });

    if (countryId) {
      this.citiesLoading.set(true);
      this.locations.cities(Number(countryId)).subscribe({
        next: (data) => {
          this.cities.set(data);
          this.citiesLoading.set(false);
          this.addressForm.patchValue({ city: address.city });
        },
        error: () => this.citiesLoading.set(false)
      });
    }
  }

  cancelForm(): void {
    this.editingLabel.set(null);
    this.showForm.set(false);
    this.addressForm.reset();
    this.pickedLocation.set(null);
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.addressForm.invalid || !this.pickedLocation()) return;
    this.isLoading.set(true);
    this.clearMessages();

    const v = this.addressForm.value;
    const selectedCountry = this.countries().find(c => c.id === Number(v.countryId));
    const loc = this.pickedLocation()!;

    const addressData: CustomerAddress = {
      label: v.label,
      street: v.street,
      city: v.city,
      state: v.state || '',
      postalCode: v.postalCode || '',
      country: selectedCountry?.name || '',
      isDefault: v.isDefault,
      latitude: loc.latitude,
      longitude: loc.longitude
    };

    const originalLabel = this.editingLabel();
    const request$ = originalLabel
      ? this.authService.editAddress(originalLabel, addressData)
      : this.authService.addAddress(addressData);

    request$.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showForm.set(false);
        this.editingLabel.set(null);
        this.addressForm.reset();
        this.pickedLocation.set(null);
        this.authService.getProfile().subscribe(() => {
          this.addresses.set(this.customer()?.addresses || []);
        });
        this.successMessage.set(originalLabel ? 'تم تعديل العنوان بنجاح' : 'تم إضافة العنوان بنجاح');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  deleteAddress(address: CustomerAddress): void {
    if (!confirm(`هل أنت متأكد من حذف عنوان "${address.label}"؟`)) return;
    this.isLoading.set(true);
    this.clearMessages();
    this.authService.removeAddress(address.label).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.addresses.set(this.addresses().filter(a => a.label !== address.label));
        this.successMessage.set('تم حذف العنوان بنجاح');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
