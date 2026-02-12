import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../../services/customer-auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            إنشاء حساب جديد
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            لديك حساب؟
            <a routerLink="/account/login" class="font-medium text-blue-600 hover:text-blue-500">
              تسجيل الدخول
            </a>
          </p>
        </div>

        <form class="mt-8 space-y-6" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          @if (errorMessage()) {
            <div class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    {{ errorMessage() }}
                  </h3>
                </div>
              </div>
            </div>
          }

          <div class="space-y-4">
            <div>
              <label for="fullName" class="block text-sm font-medium text-gray-700">
                الاسم الكامل
              </label>
              <input
                id="fullName"
                type="text"
                formControlName="fullName"
                required
                class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="أدخل اسمك الكامل"
              />
              @if (registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched) {
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
                required
                class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="example@email.com"
              />
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
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
                class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="05xxxxxxxx"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                required
                class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="********"
              />
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <p class="mt-1 text-sm text-red-600">كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم</p>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                تأكيد كلمة المرور
              </label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                required
                class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="********"
              />
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                <p class="mt-1 text-sm text-red-600">كلمتا المرور غير متطابقتين</p>
              }
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isLoading()) {
                <span>جاري إنشاء الحساب...</span>
              } @else {
                <span>إنشاء حساب</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(CustomerAuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { fullName, email, phone, password } = this.registerForm.value;

    this.authService.register({ fullName, email, phone, password }).subscribe({
      next: () => {
        this.router.navigate(['/account/profile']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      }
    });
  }
}
