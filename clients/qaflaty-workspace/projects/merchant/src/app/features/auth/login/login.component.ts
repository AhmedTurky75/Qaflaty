import { Component, inject, signal, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OtpDigitsInputComponent } from 'shared';
import { AuthService } from '../../../core/services/auth.service';

type LoginStep = 'credentials' | 'otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, OtpDigitsInputComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  @ViewChild('otpInput') otpInput?: OtpDigitsInputComponent;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  step = signal<LoginStep>('credentials');
  loading = signal(false);
  error = signal<string | null>(null);
  passwordVisible = signal(false);
  pendingEmail = signal<string>('');
  currentCode = signal('');

  resendCooldown = signal(0);
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  credentialsForm: FormGroup = this.fb.group({
    emailOrUsername: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]]
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
        this.currentCode.set('');
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
    if (this.currentCode().length !== 6 || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.authService.verifyOtp(this.pendingEmail(), this.currentCode()).subscribe({
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
        this.otpInput?.reset();
      }
    });
  }

  resendOtp(): void {
    if (this.resendCooldown() > 0) return;
    this.authService.resendOtp(this.pendingEmail()).subscribe({
      next: () => { this.startResendCooldown(); this.otpInput?.reset(); },
      error: (err) => this.error.set(err.message || 'Failed to resend OTP')
    });
  }

  goBack(): void {
    this.step.set('credentials');
    this.currentCode.set('');
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
}
