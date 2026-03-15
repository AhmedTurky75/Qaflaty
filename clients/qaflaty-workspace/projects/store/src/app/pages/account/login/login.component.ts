import { Component, inject, signal, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OtpDigitsInputComponent } from 'shared';
import { CustomerAuthService } from '../../../services/customer-auth.service';

type LoginStep = 'credentials' | 'otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, OtpDigitsInputComponent],
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
      <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 class="text-2xl font-bold text-gray-900 mb-2">رمز التحقق</h2>
        <p class="text-gray-500 text-sm mb-2">تم إرسال رمز مكوّن من 6 أرقام إلى</p>
        <p class="text-gray-800 font-medium text-sm mb-6">{{ pendingEmail() }}</p>

        <div class="mb-6">
          <lib-otp-digits-input
            #otpInput
            [hasError]="!!errorMessage()"
            [disabled]="loading()"
            (codeChange)="currentCode.set($event)"
          />
        </div>

        @if (errorMessage()) {
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-700 text-sm">{{ errorMessage() }}</p>
          </div>
        }

        <button (click)="onSubmitOtp()" [disabled]="currentCode().length !== 6 || loading()"
          class="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl
                 hover:bg-blue-700 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2 mb-4">
          @if (loading()) {
            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            جارٍ التحقق...
          } @else {
            تأكيد وتسجيل الدخول
          }
        </button>

        <div class="text-sm text-gray-500">
          لم تستلم الرمز؟
          @if (resendCooldown() > 0) {
            <span class="text-gray-400 mr-1">إعادة الإرسال بعد {{ resendCooldown() }} ثانية</span>
          } @else {
            <button type="button" (click)="resendOtp()"
              class="mr-1 text-blue-600 font-medium hover:underline">
              إعادة إرسال الرمز
            </button>
          }
        </div>

        <div class="mt-3">
          <button type="button" (click)="goBack()" class="text-sm text-gray-500 hover:text-gray-700">
            → رجوع
          </button>
        </div>
      </div>
    }

  </div>
</div>
  `
})
export class LoginComponent implements OnDestroy {
  @ViewChild('otpInput') otpInput?: OtpDigitsInputComponent;

  private fb = inject(FormBuilder);
  private authService = inject(CustomerAuthService);
  private router = inject(Router);

  step = signal<LoginStep>('credentials');
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  pendingEmail = signal('');
  currentCode = signal('');
  resendCooldown = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  credentialsForm: FormGroup = this.fb.group({
    emailOrUsername: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmitCredentials(): void {
    if (this.credentialsForm.invalid) { this.credentialsForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.authService.initiateLogin(this.credentialsForm.value).subscribe({
      next: (res) => {
        this.pendingEmail.set(res.email);
        this.currentCode.set('');
        this.step.set('otp');
        this.startCooldown();
        this.loading.set(false);
      },
      error: (err) => { this.errorMessage.set(err.message || 'بيانات غير صحيحة'); this.loading.set(false); }
    });
  }

  onSubmitOtp(): void {
    if (this.currentCode().length !== 6 || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.authService.verifyOtp(this.pendingEmail(), this.currentCode()).subscribe({
      next: () => this.router.navigate(['/account/profile']),
      error: (err) => {
        this.errorMessage.set(err.message || 'رمز غير صحيح');
        this.loading.set(false);
        this.otpInput?.reset();
      }
    });
  }

  resendOtp(): void {
    if (this.resendCooldown() > 0) return;
    this.authService.resendOtp(this.pendingEmail()).subscribe({
      next: () => { this.startCooldown(); this.otpInput?.reset(); },
      error: (err) => this.errorMessage.set(err.message || 'فشل إعادة الإرسال')
    });
  }

  goBack(): void {
    this.step.set('credentials');
    this.currentCode.set('');
    this.errorMessage.set(null);
    this.stopTimer();
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);
    this.stopTimer();
    this.timer = setInterval(() => {
      this.resendCooldown.update(v => { if (v <= 1) { this.stopTimer(); return 0; } return v - 1; });
    }, 1000);
  }

  private stopTimer(): void { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  ngOnDestroy(): void { this.stopTimer(); }

  get emailOrUsername() { return this.credentialsForm.get('emailOrUsername'); }
  get password() { return this.credentialsForm.get('password'); }
}
