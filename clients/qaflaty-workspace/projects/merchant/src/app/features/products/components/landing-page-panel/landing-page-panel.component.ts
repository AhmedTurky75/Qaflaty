import { Component, Input, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { BuilderService } from '../../../store-builder/services/builder.service';
import { StoreContextService } from '../../../../core/services/store-context.service';
import { PageConfigurationDto } from 'shared';

@Component({
  selector: 'app-landing-page-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-lg shadow p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Landing Page</h3>
          <p class="text-sm text-gray-500 mt-1">
            Give this product a dedicated, conversion-focused page with custom sections instead of the default product page.
          </p>
        </div>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500">Loading...</p>
      } @else if (page()) {
        <div class="flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [checked]="page()!.isEnabled"
              (change)="toggleEnabled()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700">
              {{ page()!.isEnabled ? 'Enabled' : 'Disabled' }}
            </span>
          </label>

          <a
            [routerLink]="['/store-builder/pages', page()!.id]"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Edit Sections
          </a>

          <button
            type="button"
            (click)="delete()"
            class="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
          >
            Delete Landing Page
          </button>
        </div>

        @if (error()) {
          <p class="text-sm text-red-600">{{ error() }}</p>
        }
      } @else {
        <div>
          <button
            type="button"
            (click)="create()"
            [disabled]="creating()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {{ creating() ? 'Creating...' : 'Create Landing Page' }}
          </button>
          @if (error()) {
            <p class="text-sm text-red-600 mt-2">{{ error() }}</p>
          }
        </div>
      }
    </div>
  `
})
export class LandingPagePanelComponent implements OnChanges {
  @Input() productId: string | null = null;

  private productService = inject(ProductService);
  private builderService = inject(BuilderService);
  private storeContext = inject(StoreContextService);

  loading = signal(false);
  creating = signal(false);
  error = signal<string | null>(null);
  page = signal<PageConfigurationDto | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && this.productId) {
      this.load();
    }
  }

  load(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.productId) return;

    this.loading.set(true);
    this.productService.getLandingPage(storeId, this.productId).subscribe({
      next: (page) => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.page.set(null);
        this.loading.set(false);
      }
    });
  }

  create(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.productId) return;

    this.creating.set(true);
    this.error.set(null);
    this.productService.createLandingPage(storeId, this.productId).subscribe({
      next: (page) => {
        this.page.set(page);
        this.creating.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create landing page');
        this.creating.set(false);
      }
    });
  }

  toggleEnabled(): void {
    const storeId = this.storeContext.currentStoreId();
    const current = this.page();
    if (!storeId || !current) return;

    const updated = { ...current, isEnabled: !current.isEnabled };
    this.builderService.updatePage(storeId, current.id, {
      title: current.title,
      slug: current.slug,
      isEnabled: updated.isEnabled,
      seoSettings: current.seoSettings,
      contentJson: current.contentJson
    }).subscribe({
      next: () => this.page.set(updated),
      error: (err) => this.error.set(err.error?.message || 'Failed to update landing page')
    });
  }

  delete(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.productId) return;
    if (!confirm('Delete this landing page? This cannot be undone.')) return;

    this.productService.deleteLandingPage(storeId, this.productId).subscribe({
      next: () => this.page.set(null),
      error: (err) => this.error.set(err.error?.message || 'Failed to delete landing page')
    });
  }
}
