import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../../services/customer-auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="bg-white shadow rounded-lg">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900">الملف الشخصي</h2>
            <p class="mt-1 text-sm text-gray-600">إدارة معلومات حسابك الشخصية</p>
          </div>

          <!-- Success Message -->
          @if (successMessage()) {
            <div class="mx-6 mt-4 rounded-md bg-green-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800">
                    {{ successMessage() }}
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="mx-6 mt-4 rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800">
                    {{ errorMessage() }}
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- View Mode -->
          @if (!isEditing()) {
            <div class="px-6 py-5">
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm font-medium text-gray-500">الاسم الكامل</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ customer()?.fullName }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">البريد الإلكتروني</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ customer()?.email }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">رقم الهاتف</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ customer()?.phone || 'غير محدد' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">تاريخ الانضمام</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDate(customer()?.createdAt) }}</dd>
                </div>
              </dl>

              <div class="mt-6 flex gap-3">
                <button
                  type="button"
                  (click)="startEditing()"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  تعديل الملف الشخصي
                </button>
                <a
                  routerLink="/account/addresses"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  إدارة العناوين
                </a>
                <a
                  routerLink="/account/orders"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  طلباتي
                </a>
              </div>
            </div>
          }

          <!-- Edit Mode -->
          @if (isEditing()) {
            <form class="px-6 py-5 space-y-6" [formGroup]="profileForm" (ngSubmit)="onSubmit()">
              <div>
                <label for="fullName" class="block text-sm font-medium text-gray-700">
                  الاسم الكامل
                </label>
                <input
                  id="fullName"
                  type="text"
                  formControlName="fullName"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                @if (profileForm.get('fullName')?.invalid && profileForm.get('fullName')?.touched) {
                  <p class="mt-1 text-sm text-red-600">الاسم الكامل مطلوب (2-100 حرف)</p>
                }
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
                  <p class="mt-1 text-sm text-red-600">يرجى إدخال بريد إلكتروني صحيح</p>
                }
              </div>

              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700">
                  رقم الهاتف (اختياري)
                </label>
                <input
                  id="phone"
                  type="tel"
                  formControlName="phone"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  type="submit"
                  [disabled]="profileForm.invalid || isLoading()"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  @if (isLoading()) {
                    <span>جاري الحفظ...</span>
                  } @else {
                    <span>حفظ التغييرات</span>
                  }
                </button>
                <button
                  type="button"
                  (click)="cancelEditing()"
                  [disabled]="isLoading()"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          }
        </div>

        <!-- Logout Section -->
        <div class="mt-6 bg-white shadow rounded-lg px-6 py-4">
          <h3 class="text-lg font-medium text-gray-900 mb-2">تسجيل الخروج</h3>
          <p class="text-sm text-gray-600 mb-4">
            تسجيل الخروج من حسابك على هذا الجهاز
          </p>
          <button
            type="button"
            (click)="logout()"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(CustomerAuthService);
  private readonly router = inject(Router);

  readonly customer = this.authService.customer;
  readonly isEditing = signal(false);
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['']
  });

  ngOnInit(): void {
    const customer = this.customer();
    if (!customer) {
      this.router.navigate(['/account/login']);
      return;
    }

    // Initialize form with current customer data
    this.profileForm.patchValue({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone || ''
    });
  }

  startEditing(): void {
    this.isEditing.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // Reset form to current customer data
    const customer = this.customer();
    if (customer) {
      this.profileForm.patchValue({
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone || ''
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { fullName, email, phone } = this.profileForm.value;

    this.authService.updateProfile({ fullName, email, phone }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isEditing.set(false);
        this.successMessage.set('تم تحديث الملف الشخصي بنجاح');

        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
