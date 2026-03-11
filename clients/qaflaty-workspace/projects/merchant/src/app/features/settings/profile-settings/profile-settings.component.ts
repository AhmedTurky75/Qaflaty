import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

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

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.pattern(/^[\d\s\-\+\(\)]+$/)]]
    });

    const m = this.authService.currentMerchant();
    if (m) {
      this.profileForm.patchValue({ firstName: m.firstName, lastName: m.lastName, username: m.username, email: m.email, phone: m.phone || '' });
    } else {
      this.authService.getCurrentMerchant().subscribe(loaded => {
        this.profileForm.patchValue({ firstName: loaded.firstName, lastName: loaded.lastName, username: loaded.username, email: loaded.email, phone: loaded.phone || '' });
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.success.set(false);
    this.error.set(null);

    this.authService.updateProfile({
      firstName: this.profileForm.get('firstName')!.value,
      lastName: this.profileForm.get('lastName')!.value,
      phone: this.profileForm.get('phone')?.value || undefined
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.success.set(false), 5000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update profile.');
        this.loading.set(false);
      }
    });
  }

  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get phone() { return this.profileForm.get('phone'); }
}
