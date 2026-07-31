import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CurrencyOption } from 'shared';
import { StoreService } from '../services/store.service';
import { SlugInputComponent } from '../components/slug-input/slug-input.component';
import { StoreContextService } from '../../../core/services/store-context.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-create-store',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe, SlugInputComponent, IconComponent],
  templateUrl: './create-store.component.html',
  styleUrls: ['./create-store.component.scss']
})
export class CreateStoreComponent implements OnInit {
  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private storeContext = inject(StoreContextService);
  private router = inject(Router);

  createForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  slugValid = signal(false);
  currencies = signal<CurrencyOption[]>([]);

  constructor() {
    this.createForm = this.fb.group({
      slug: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      // Chosen once, then locked — every price/fee/tax in the store uses this currency.
      currency: ['EGP', Validators.required]
    });
  }

  ngOnInit(): void {
    this.storeService.getCurrencies().subscribe({
      next: (currencies) => this.currencies.set(currencies),
      error: () => this.currencies.set([
        { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound', decimalDigits: 2 },
        { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', decimalDigits: 2 },
        { code: 'USD', symbol: '$', name: 'US Dollar', decimalDigits: 2 }
      ])
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
