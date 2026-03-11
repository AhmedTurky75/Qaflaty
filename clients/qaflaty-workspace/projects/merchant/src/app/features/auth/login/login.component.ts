import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type LoginStep = 'credentials' | 'otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  step = signal<LoginStep>('credentials');
  loading = signal(false);
  error = signal<string | null>(null);
  passwordVisible = signal(false);
  pendingEmail = signal<string>('');

  // OTP resend cooldown
  resendCooldown = signal(0);
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  credentialsForm: FormGroup = this.fb.group({
    emailOrUsername: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  otpForm: FormGroup = this.fb.group({
    otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  togglePasswordVisibility(): void {
    this.passwordVisible.update(v => !v);
  }

  onSubmitCredentials(): void {
    if (this.credentialsForm.invalid) {
      this.credentialsForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.authService.initiateLogin(this.credentialsForm.value).subscribe({
      next: (res) => {
        this.pendingEmail.set(res.email);
        this.step.set('otp');
        this.startResendCooldown();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }

  onSubmitOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.authService.verifyOtp(this.pendingEmail(), this.otpForm.value.otpCode).subscribe({
      next: (res) => {
        if (res.storeIds.length === 0) {
          this.router.navigate(['/stores/new']);
        } else if (res.storeIds.length === 1) {
          this.authService.selectStore(res.storeIds[0]).subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.router.navigate(['/auth/select-store'])
          });
        } else {
          this.router.navigate(['/auth/select-store']);
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Invalid OTP code');
        this.loading.set(false);
      }
    });
  }

  resendOtp(): void {
    if (this.resendCooldown() > 0) return;
    this.authService.resendOtp(this.pendingEmail()).subscribe({
      next: () => this.startResendCooldown(),
      error: (err) => this.error.set(err.message || 'Failed to resend OTP')
    });
  }

  goBack(): void {
    this.step.set('credentials');
    this.otpForm.reset();
    this.error.set(null);
    this.stopCooldown();
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    this.stopCooldown();
    this.countdownTimer = setInterval(() => {
      this.resendCooldown.update(v => {
        if (v <= 1) { this.stopCooldown(); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
  }

  ngOnDestroy(): void { this.stopCooldown(); }

  get emailOrUsername() { return this.credentialsForm.get('emailOrUsername'); }
  get password() { return this.credentialsForm.get('password'); }
  get otpCode() { return this.otpForm.get('otpCode'); }
}
