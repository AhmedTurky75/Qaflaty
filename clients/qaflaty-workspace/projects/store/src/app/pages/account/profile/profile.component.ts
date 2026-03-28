import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../../services/customer-auth.service';
import { PhoneInputComponent } from 'shared';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PhoneInputComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="bg-white shadow rounded-lg">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900">الملف الشخصي</h2>
            <p class="mt-1 text-sm text-gray-600">إدارة معلومات حسابك الشخصية</p>
          </div>

          @if (successMessage()) {
            <div class="mx-6 mt-4 rounded-md bg-green-50 p-4">
              <p class="text-sm font-medium text-green-800">{{ successMessage() }}</p>
            </div>
          }

          @if (errorMessage()) {
            <div class="mx-6 mt-4 rounded-md bg-red-50 p-4">
              <p class="text-sm font-medium text-red-800">{{ errorMessage() }}</p>
            </div>
          }

          <!-- View Mode -->
          @if (!isEditing()) {
            <div class="px-6 py-5">
              <dl class="space-y-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">الاسم الأول</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ customer()?.firstName }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">الاسم الأخير</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ customer()?.lastName }}</dd>
                  </div>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">اسم المستخدم</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ customer()?.username }}</dd>
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
                  <dt class="text-sm font-medium text-gray-500">رقم هاتف إضافي</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ customer()?.secondaryPhone || 'غير محدد' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">تاريخ الانضمام</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDate(customer()?.createdAt) }}</dd>
                </div>
              </dl>

              <div class="mt-6 flex flex-wrap gap-3">
                <button type="button" (click)="startEditing()"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  تعديل الملف الشخصي
                </button>
                <a routerLink="/account/addresses"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  إدارة العناوين
                </a>
                <a routerLink="/account/orders"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  طلباتي
                </a>
              </div>
            </div>
          }

          <!-- Edit Mode -->
          @if (isEditing()) {
            <form class="px-6 py-5 space-y-6" [formGroup]="profileForm" (ngSubmit)="onSubmit()">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-700">
                    الاسم الأول <span class="text-red-500">*</span>
                  </label>
                  <input id="firstName" type="text" formControlName="firstName"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    [class.border-red-300]="profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched" />
                  @if (profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched) {
                    <p class="mt-1 text-sm text-red-600">الاسم الأول مطلوب (2 أحرف على الأقل)</p>
                  }
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-700">
                    الاسم الأخير <span class="text-red-500">*</span>
                  </label>
                  <input id="lastName" type="text" formControlName="lastName"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    [class.border-red-300]="profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched" />
                  @if (profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched) {
                    <p class="mt-1 text-sm text-red-600">الاسم الأخير مطلوب (2 أحرف على الأقل)</p>
                  }
                </div>
              </div>

              <div>
                <label for="username" class="block text-sm font-medium text-gray-700">اسم المستخدم</label>
                <input id="username" type="text" formControlName="username"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm" />
                <p class="mt-1 text-xs text-gray-500">لا يمكن تغيير اسم المستخدم بعد التسجيل.</p>
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                <input id="email" type="email" formControlName="email"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">رقم الهاتف (اختياري)</label>
                <div class="mt-1">
                  <lib-phone-input formControlName="phone"
                    (regionCodeChange)="profileForm.get('phoneCountryCode')?.setValue($event)">
                  </lib-phone-input>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">رقم هاتف إضافي (اختياري)</label>
                <div class="mt-1">
                  <lib-phone-input formControlName="secondaryPhone"
                    (regionCodeChange)="profileForm.get('secondaryPhoneCountryCode')?.setValue($event)">
                  </lib-phone-input>
                </div>
              </div>

              <div class="flex gap-3 pt-4">
                <button type="submit" [disabled]="profileForm.invalid || isLoading()"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  @if (isLoading()) { <span>جاري الحفظ...</span> } @else { <span>حفظ التغييرات</span> }
                </button>
                <button type="button" (click)="cancelEditing()" [disabled]="isLoading()"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                  إلغاء
                </button>
              </div>
            </form>
          }
        </div>

        <!-- Logout Section -->
        <div class="mt-6 bg-white shadow rounded-lg px-6 py-4">
          <h3 class="text-lg font-medium text-gray-900 mb-2">تسجيل الخروج</h3>
          <p class="text-sm text-gray-600 mb-4">تسجيل الخروج من حسابك على هذا الجهاز</p>
          <button type="button" (click)="logout()"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
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
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    username: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    phone: [''],
    phoneCountryCode: ['SA'],
    secondaryPhone: [''],
    secondaryPhoneCountryCode: ['SA']
  });

  ngOnInit(): void {
    const customer = this.customer();
    if (!customer) {
      this.router.navigate(['/account/login']);
      return;
    }
    this.profileForm.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      username: customer.username,
      email: customer.email,
      phone: customer.phone || '',
      phoneCountryCode: customer.phoneCountryCode || 'SA',
      secondaryPhone: customer.secondaryPhone || '',
      secondaryPhoneCountryCode: customer.secondaryPhoneCountryCode || 'SA'
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
    const customer = this.customer();
    if (customer) {
      this.profileForm.patchValue({
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone || '',
        phoneCountryCode: customer.phoneCountryCode || 'SA',
        secondaryPhone: customer.secondaryPhone || '',
        secondaryPhoneCountryCode: customer.secondaryPhoneCountryCode || 'SA'
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { firstName, lastName, phone, phoneCountryCode, secondaryPhone, secondaryPhoneCountryCode } = this.profileForm.value;
    this.authService.updateProfile({
      firstName,
      lastName,
      phone: phone || undefined,
      phoneCountryCode: phone ? (phoneCountryCode || undefined) : undefined,
      secondaryPhone: secondaryPhone || undefined,
      secondaryPhoneCountryCode: secondaryPhone ? (secondaryPhoneCountryCode || undefined) : undefined
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isEditing.set(false);
        this.successMessage.set('تم تحديث الملف الشخصي بنجاح');
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
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
