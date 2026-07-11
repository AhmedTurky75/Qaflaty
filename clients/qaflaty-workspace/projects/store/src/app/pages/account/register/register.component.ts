import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../../services/customer-auth.service';
import { TrackingService } from '../../../services/tracking.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="text-center text-3xl font-extrabold text-gray-900">إنشاء حساب جديد</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        لديك حساب؟ <a routerLink="/account/login" class="font-medium text-blue-600">تسجيل الدخول</a>
      </p>
    </div>
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-5">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">الاسم الأول</label>
          <input type="text" formControlName="firstName"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          @if (firstName?.invalid && firstName?.touched) { <p class="text-xs text-red-600 mt-1">مطلوب (2-50 حرف)</p> }
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">اسم العائلة</label>
          <input type="text" formControlName="lastName"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          @if (lastName?.invalid && lastName?.touched) { <p class="text-xs text-red-600 mt-1">مطلوب (2-50 حرف)</p> }
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">اسم المستخدم</label>
        <input type="text" formControlName="username" autocomplete="username"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        @if (username?.invalid && username?.touched) { <p class="text-xs text-red-600 mt-1">3-50 حرف، أحرف وأرقام وشرطة سفلية فقط</p> }
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
        <input type="email" formControlName="email" autocomplete="email"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        @if (email?.invalid && email?.touched) { <p class="text-xs text-red-600 mt-1">بريد إلكتروني صحيح مطلوب</p> }
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">رقم الهاتف (اختياري)</label>
        <input type="tel" formControlName="phone"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">كلمة المرور</label>
        <input type="password" formControlName="password" autocomplete="new-password"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        @if (password?.invalid && password?.touched) { <p class="text-xs text-red-600 mt-1">8 أحرف على الأقل</p> }
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">تأكيد كلمة المرور</label>
        <input type="password" formControlName="confirmPassword" autocomplete="new-password"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        @if (confirmPassword?.errors?.['passwordMismatch'] && confirmPassword?.touched) {
          <p class="text-xs text-red-600 mt-1">كلمتا المرور غير متطابقتين</p>
        }
      </div>
      @if (errorMessage()) {
        <div class="bg-red-50 text-red-700 p-3 rounded-md text-sm">{{ errorMessage() }}</div>
      }
      <button type="submit" [disabled]="loading()"
        class="w-full py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-medium">
        {{ loading() ? 'جارٍ التسجيل...' : 'إنشاء الحساب' }}
      </button>
    </form>
  </div>
</div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(CustomerAuthService);
  private router = inject(Router);
  private tracking = inject(TrackingService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    username:  ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    email:     ['', [Validators.required, Validators.email]],
    phone:     [''],
    password:  ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(form: AbstractControl) {
    const pw = form.get('password')?.value;
    const cpw = form.get('confirmPassword')?.value;
    if (pw && cpw && pw !== cpw) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.loading.set(true); this.errorMessage.set(null);
    const { confirmPassword, ...data } = this.registerForm.value;
    this.authService.register(data).subscribe({
      next: () => {
        this.tracking.track('CompleteRegistration', { customerEmail: data.email });
        this.router.navigate(['/account/profile']);
      },
      error: (err: any) => { this.errorMessage.set(err.message || 'فشل التسجيل'); this.loading.set(false); }
    });
  }

  get firstName()       { return this.registerForm.get('firstName'); }
  get lastName()        { return this.registerForm.get('lastName'); }
  get username()        { return this.registerForm.get('username'); }
  get email()           { return this.registerForm.get('email'); }
  get phone()           { return this.registerForm.get('phone'); }
  get password()        { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
