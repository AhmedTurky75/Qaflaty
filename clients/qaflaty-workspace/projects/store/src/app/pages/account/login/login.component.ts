import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../../services/customer-auth.service';

type LoginStep = 'credentials' | 'otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
  <div class="max-w-md w-full space-y-8">

    <!-- Step 1: Credentials -->
    @if (step() === 'credentials') {
      <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900">تسجيل الدخول</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          أو <a routerLink="/account/register" class="font-medium text-blue-600">إنشاء حساب جديد</a>
        </p>
      </div>
      <form [formGroup]="credentialsForm" (ngSubmit)="onSubmitCredentials()" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">البريد الإلكتروني أو اسم المستخدم</label>
            <input type="text" formControlName="emailOrUsername" autocomplete="username"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            @if (emailOrUsername?.invalid && emailOrUsername?.touched) {
              <p class="text-sm text-red-600 mt-1">هذا الحقل مطلوب</p>
            }
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">كلمة المرور</label>
            <input type="password" formControlName="password" autocomplete="current-password"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            @if (password?.invalid && password?.touched) {
              <p class="text-sm text-red-600 mt-1">8 أحرف على الأقل</p>
            }
          </div>
        </div>
        @if (errorMessage()) {
          <div class="bg-red-50 text-red-700 p-3 rounded-md text-sm">{{ errorMessage() }}</div>
        }
        <button type="submit" [disabled]="loading()"
          class="w-full py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-medium">
          {{ loading() ? 'جارٍ الإرسال...' : 'متابعة' }}
        </button>
      </form>
    }

    <!-- Step 2: OTP -->
    @if (step() === 'otp') {
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900">رمز التحقق</h2>
        <p class="mt-2 text-sm text-gray-600">
          تم إرسال رمز مكوّن من 6 أرقام إلى <strong>{{ pendingEmail() }}</strong>
        </p>
      </div>
      <form [formGroup]="otpForm" (ngSubmit)="onSubmitOtp()" class="mt-8 space-y-6">
        <div>
          <input type="text" formControlName="otpCode" maxlength="6" inputmode="numeric" autocomplete="one-time-code"
            class="block w-full text-center text-3xl tracking-widest py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </div>
        @if (errorMessage()) {
          <div class="bg-red-50 text-red-700 p-3 rounded-md text-sm text-center">{{ errorMessage() }}</div>
        }
        <button type="submit" [disabled]="loading()"
          class="w-full py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-medium">
          {{ loading() ? 'جارٍ التحقق...' : 'تأكيد وتسجيل الدخول' }}
        </button>
        <div class="text-center space-y-2">
          @if (resendCooldown() > 0) {
            <p class="text-sm text-gray-500">إعادة الإرسال بعد {{ resendCooldown() }} ثانية</p>
          } @else {
            <button type="button" (click)="resendOtp()" class="text-sm text-blue-600 hover:text-blue-500">إعادة إرسال الرمز</button>
          }
          <div><button type="button" (click)="goBack()" class="text-sm text-gray-500">← رجوع</button></div>
        </div>
      </form>
    }

  </div>
</div>
  `
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(CustomerAuthService);
  private router = inject(Router);

  step = signal<LoginStep>('credentials');
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  pendingEmail = signal('');
  resendCooldown = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  credentialsForm: FormGroup = this.fb.group({
    emailOrUsername: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  otpForm: FormGroup = this.fb.group({
    otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  onSubmitCredentials(): void {
    if (this.credentialsForm.invalid) { this.credentialsForm.markAllAsTouched(); return; }
    this.loading.set(true); this.errorMessage.set(null);
    this.authService.initiateLogin(this.credentialsForm.value).subscribe({
      next: (res) => { this.pendingEmail.set(res.email); this.step.set('otp'); this.startCooldown(); this.loading.set(false); },
      error: (err) => { this.errorMessage.set(err.message || 'بيانات غير صحيحة'); this.loading.set(false); }
    });
  }

  onSubmitOtp(): void {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading.set(true); this.errorMessage.set(null);
    this.authService.verifyOtp(this.pendingEmail(), this.otpForm.value.otpCode).subscribe({
      next: () => this.router.navigate(['/account/profile']),
      error: (err) => { this.errorMessage.set(err.message || 'رمز غير صحيح'); this.loading.set(false); }
    });
  }

  resendOtp(): void {
    if (this.resendCooldown() > 0) return;
    this.authService.resendOtp(this.pendingEmail()).subscribe({
      next: () => this.startCooldown(),
      error: (err) => this.errorMessage.set(err.message || 'فشل إعادة الإرسال')
    });
  }

  goBack(): void { this.step.set('credentials'); this.otpForm.reset(); this.errorMessage.set(null); this.stopTimer(); }

  private startCooldown(): void {
    this.resendCooldown.set(60); this.stopTimer();
    this.timer = setInterval(() => {
      this.resendCooldown.update(v => { if (v <= 1) { this.stopTimer(); return 0; } return v - 1; });
    }, 1000);
  }

  private stopTimer(): void { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  ngOnDestroy(): void { this.stopTimer(); }

  get emailOrUsername() { return this.credentialsForm.get('emailOrUsername'); }
  get password() { return this.credentialsForm.get('password'); }
  get otpCode() { return this.otpForm.get('otpCode'); }
}
