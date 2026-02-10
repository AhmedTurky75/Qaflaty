import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../services/store.service';
import { SlugInputComponent } from '../components/slug-input/slug-input.component';
import { StoreContextService } from '../../../core/services/store-context.service';

@Component({
  selector: 'app-create-store',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SlugInputComponent],
  templateUrl: './create-store.component.html',
  styleUrls: ['./create-store.component.scss']
})
export class CreateStoreComponent {
  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private storeContext = inject(StoreContextService);
  private router = inject(Router);

  createForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  slugValid = signal(false);

  constructor() {
    this.createForm = this.fb.group({
      slug: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)]
    });
  }

  onSlugChange(slug: string): void {
    this.createForm.patchValue({ slug });
  }

  onSlugValidChange(valid: boolean): void {
    this.slugValid.set(valid);
  }

  onSubmit(): void {
    if (this.createForm.invalid || !this.slugValid()) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.storeService.createStore(this.createForm.value).subscribe({
      next: (store) => {
        this.storeContext.refresh();
        this.storeContext.selectStore(store.id);
        this.router.navigate(['/stores', store.id]);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to create store');
        this.loading.set(false);
      }
    });
  }

  get name() {
    return this.createForm.get('name');
  }

  get description() {
    return this.createForm.get('description');
  }
}
