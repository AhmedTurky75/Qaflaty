import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-password-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-settings.component.html'
})
export class PasswordSettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  passwordForm: FormGroup;
  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

  currentPasswordVisible = signal(false);
  newPasswordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  passwordStrength = computed(() => {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return this.calculatePasswordStrength(password);
  });

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const valid = hasUpperCase && hasLowerCase && hasNumeric;

    if (!valid) {
      return {
        weakPassword: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecial
        }
      };
    }

    return null;
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  private calculatePasswordStrength(password: string): {
    level: 'weak' | 'medium' | 'strong';
    percentage: number;
    color: string;
  } {
    if (!password) {
      return { level: 'weak', percentage: 0, color: 'bg-gray-300' };
    }

    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

    if (strength < 50) {
      return { level: 'weak', percentage: strength, color: 'bg-red-500' };
    } else if (strength < 80) {
      return { level: 'medium', percentage: strength, color: 'bg-yellow-500' };
    } else {
      return { level: 'strong', percentage: strength, color: 'bg-green-500' };
    }
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.currentPasswordVisible.update(v => !v);
    } else if (field === 'new') {
      this.newPasswordVisible.update(v => !v);
    } else {
      this.confirmPasswordVisible.update(v => !v);
    }
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.success.set(false);
    this.error.set(null);

    const request = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    this.authService.changePassword(request).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        this.passwordForm.reset();

        // Recommend logout after password change
        setTimeout(() => {
          if (confirm('Password changed successfully! It is recommended to log in again. Would you like to log out now?')) {
            this.authService.logout();
          }
        }, 1000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to change password. Please check your current password and try again.');
        this.loading.set(false);
      }
    });
  }

  get currentPassword() {
    return this.passwordForm.get('currentPassword');
  }

  get newPassword() {
    return this.passwordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.passwordForm.get('confirmPassword');
  }
}
