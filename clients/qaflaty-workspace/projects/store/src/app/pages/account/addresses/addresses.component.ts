import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService, CustomerAddress } from '../../../services/customer-auth.service';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
            <button
              type="button"
              (click)="openAddForm()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              إضافة عنوان جديد
            </button>
          </div>
        </div>

        <!-- Success/Error Messages -->
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

        <!-- Add/Edit Form -->
        @if (showForm()) {
          <div class="mb-6 bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ editingAddress() ? 'تعديل العنوان' : 'إضافة عنوان جديد' }}
            </h3>
            <form [formGroup]="addressForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label for="label" class="block text-sm font-medium text-gray-700">
                  اسم العنوان <span class="text-red-500">*</span>
                </label>
                <input
                  id="label"
                  type="text"
                  formControlName="label"
                  placeholder="المنزل، العمل، إلخ"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                @if (addressForm.get('label')?.invalid && addressForm.get('label')?.touched) {
                  <p class="mt-1 text-sm text-red-600">اسم العنوان مطلوب</p>
                }
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="street" class="block text-sm font-medium text-gray-700">
                    الشارع <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="street"
                    type="text"
                    formControlName="street"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="city" class="block text-sm font-medium text-gray-700">
                    المدينة <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    formControlName="city"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="state" class="block text-sm font-medium text-gray-700">
                    المنطقة <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="state"
                    type="text"
                    formControlName="state"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="postalCode" class="block text-sm font-medium text-gray-700">
                    الرمز البريدي
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    formControlName="postalCode"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label for="country" class="block text-sm font-medium text-gray-700">
                  الدولة <span class="text-red-500">*</span>
                </label>
                <input
                  id="country"
                  type="text"
                  formControlName="country"
                  value="المملكة العربية السعودية"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label for="phoneNumber" class="block text-sm font-medium text-gray-700">
                  رقم الهاتف <span class="text-red-500">*</span>
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  formControlName="phoneNumber"
                  placeholder="05xxxxxxxx"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div class="flex items-center">
                <input
                  id="isDefault"
                  type="checkbox"
                  formControlName="isDefault"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="isDefault" class="mr-2 block text-sm text-gray-900">
                  تعيين كعنوان افتراضي
                </label>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  type="submit"
                  [disabled]="addressForm.invalid || isLoading()"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isLoading() ? 'جاري الحفظ...' : 'حفظ العنوان' }}
                </button>
                <button
                  type="button"
                  (click)="cancelForm()"
                  [disabled]="isLoading()"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
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
              <button
                type="button"
                (click)="openAddForm()"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
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
                  <p>{{ address.city }}، {{ address.state }}</p>
                  @if (address.postalCode) {
                    <p>{{ address.postalCode }}</p>
                  }
                  <p>{{ address.country }}</p>
                  <p class="mt-2">{{ address.phoneNumber }}</p>
                </div>
                <div class="mt-4 flex gap-2">
                  <button
                    type="button"
                    (click)="editAddress(address)"
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    تعديل
                  </button>
                  @if (!address.isDefault) {
                    <button
                      type="button"
                      (click)="setAsDefault(address)"
                      class="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      تعيين كافتراضي
                    </button>
                  }
                  @if (addresses().length > 1) {
                    <button
                      type="button"
                      (click)="deleteAddress(address)"
                      class="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
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
          <a
            routerLink="/account/profile"
            class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
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

  readonly customer = this.authService.customer;
  readonly addresses = signal<CustomerAddress[]>([]);
  readonly showForm = signal(false);
  readonly editingAddress = signal<CustomerAddress | null>(null);
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  addressForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(50)]],
    street: ['', [Validators.required, Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.maxLength(100)]],
    postalCode: ['', [Validators.maxLength(20)]],
    country: ['المملكة العربية السعودية', [Validators.required, Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^05\d{8}$/)]],
    isDefault: [false]
  });

  ngOnInit(): void {
    const customer = this.customer();
    if (!customer) {
      this.router.navigate(['/account/login']);
      return;
    }

    this.loadAddresses();
  }

  loadAddresses(): void {
    const customer = this.customer();
    if (customer) {
      this.addresses.set(customer.addresses || []);
    }
  }

  openAddForm(): void {
    this.showForm.set(true);
    this.editingAddress.set(null);
    this.addressForm.reset({ country: 'المملكة العربية السعودية', isDefault: false });
    this.clearMessages();
  }

  editAddress(address: CustomerAddress): void {
    this.showForm.set(true);
    this.editingAddress.set(address);
    this.addressForm.patchValue(address);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingAddress.set(null);
    this.addressForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.addressForm.invalid) return;

    this.isLoading.set(true);
    this.clearMessages();

    const addressData = this.addressForm.value;
    const editing = this.editingAddress();

    const request = editing
      ? this.authService.updateAddress(editing.label, addressData)
      : this.authService.addAddress(addressData);

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showForm.set(false);
        this.editingAddress.set(null);
        this.addressForm.reset();
        this.loadAddresses();
        this.successMessage.set(editing ? 'تم تحديث العنوان بنجاح' : 'تم إضافة العنوان بنجاح');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  setAsDefault(address: CustomerAddress): void {
    this.isLoading.set(true);
    this.clearMessages();

    this.authService.setDefaultAddress(address.label).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.loadAddresses();
        this.successMessage.set('تم تعيين العنوان الافتراضي بنجاح');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  deleteAddress(address: CustomerAddress): void {
    if (!confirm(`هل أنت متأكد من حذف عنوان "${address.label}"؟`)) {
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    this.authService.removeAddress(address.label).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.loadAddresses();
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
