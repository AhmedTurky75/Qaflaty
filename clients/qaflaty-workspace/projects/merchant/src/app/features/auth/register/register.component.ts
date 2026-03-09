import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  passwordVisible = signal(false);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    username:  ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    email:     ['', [Validators.required, Validators.email]],
    phone:     ['', [Validators.pattern(/^[0-9+\-() ]+$/)]],
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

  togglePasswordVisibility(): void { this.passwordVisible.update(v => !v); }

  onSubmit(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }

    this.loading.set(true);
    this.error.set(null);

    const { confirmPassword, ...data } = this.registerForm.value;
    this.authService.register(data).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.error.set(err.message || 'Registration failed'); this.loading.set(false); }
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
