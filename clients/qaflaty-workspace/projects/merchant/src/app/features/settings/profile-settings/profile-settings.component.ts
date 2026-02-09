import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MerchantDto } from 'shared';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-settings.component.html'
})
export class ProfileSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  profileForm!: FormGroup;
  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);
  currentMerchant = signal<MerchantDto | null>(null);

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentMerchant();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.pattern(/^[\d\s\-\+\(\)]+$/)]]
    });
  }

  private loadCurrentMerchant(): void {
    this.authService.currentMerchant$.subscribe(merchant => {
      if (merchant) {
        this.currentMerchant.set(merchant);
        this.profileForm.patchValue({
          fullName: merchant.fullName,
          email: merchant.email,
          phone: merchant.phone || ''
        });
      } else {
        this.authService.getCurrentMerchant().subscribe();
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.success.set(false);
    this.error.set(null);

    const request = {
      fullName: this.profileForm.get('fullName')?.value,
      phone: this.profileForm.get('phone')?.value || undefined
    };

    this.authService.updateProfile(request).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.success.set(false), 5000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update profile. Please try again.');
        this.loading.set(false);
      }
    });
  }

  get fullName() {
    return this.profileForm.get('fullName');
  }

  get phone() {
    return this.profileForm.get('phone');
  }
}
