import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-slug-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './slug-input.component.html',
  styleUrls: ['./slug-input.component.scss']
})
export class SlugInputComponent implements OnInit, OnDestroy {
  @Input() initialValue = '';
  @Input() label = 'Store Slug';
  @Output() slugChange = new EventEmitter<string>();
  @Output() validChange = new EventEmitter<boolean>();

  private storeService = inject(StoreService);
  private destroy$ = new Subject<void>();

  slugControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(50),
    Validators.pattern(/^[a-z][a-z0-9-]*[a-z0-9]$/)
  ]);

  checking = signal(false);
  available = signal<boolean | null>(null);
  error = signal<string | null>(null);

  private readonly RESERVED_SLUGS = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp',
    'dashboard', 'auth', 'login', 'register', 'signup'
  ];

  ngOnInit(): void {
    if (this.initialValue) {
      this.slugControl.setValue(this.initialValue);
    }

    // Listen to value changes and validate
    this.slugControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.validateSlug(value || '');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toLowerCase();

    // Remove invalid characters and format
    value = value
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '');

    if (value !== input.value) {
      this.slugControl.setValue(value, { emitEvent: false });
    }
  }

  private validateSlug(slug: string): void {
    this.error.set(null);
    this.available.set(null);

    if (!slug) {
      this.error.set('Slug is required');
      this.validChange.emit(false);
      return;
    }

    if (this.slugControl.errors) {
      if (this.slugControl.errors['minlength']) {
        this.error.set('Slug must be at least 3 characters');
      } else if (this.slugControl.errors['maxlength']) {
        this.error.set('Slug must not exceed 50 characters');
      } else if (this.slugControl.errors['pattern']) {
        this.error.set('Slug must start with a letter and contain only lowercase letters, numbers, and hyphens');
      }
      this.validChange.emit(false);
      return;
    }

    // Check reserved words
    if (this.RESERVED_SLUGS.includes(slug)) {
      this.error.set('This slug is reserved and cannot be used');
      this.available.set(false);
      this.validChange.emit(false);
      return;
    }

    // Check availability with backend
    this.checking.set(true);
    this.storeService.checkSlugAvailability(slug).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.checking.set(false);
        this.available.set(result.available);

        if (result.available) {
          this.slugChange.emit(slug);
          this.validChange.emit(true);
        } else {
          this.error.set('This slug is already taken');
          this.validChange.emit(false);
        }
      },
      error: () => {
        this.checking.set(false);
        this.error.set('Failed to check slug availability');
        this.validChange.emit(false);
      }
    });
  }

  getPreviewUrl(): string {
    const slug = this.slugControl.value || 'your-store';
    return `${slug}.qaflaty.com`;
  }
}
