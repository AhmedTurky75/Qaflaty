import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { PageConfigurationDto, UpdatePageConfigurationRequest, CreateCustomPageRequest } from 'shared';

@Component({
  selector: 'app-pages-manager',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a [routerLink]="'/store-builder'" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </a>
            <h1 class="text-lg font-semibold text-gray-900">Pages</h1>
          </div>
          <button
            (click)="openCreateModal()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Custom Page
          </button>
        </div>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading()) {
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500">Loading pages...</p>
          </div>
        }

        @if (loadErr()) {
          <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700">{{ loadErr() }}</p>
          </div>
        }

        @if (!loading() && !loadErr()) {
          <div class="space-y-3">
            @for (page of pages(); track page.id) {
              <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div class="flex items-center gap-4">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900">
                      {{ page.title.english }}
                      @if (page.title.arabic) {
                        <span class="text-gray-500 font-normal"> ({{ page.title.arabic }})</span>
                      }
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ page.pageType }} &middot; /{{ page.slug }}</p>
                  </div>

                  <div class="flex items-center gap-3 flex-shrink-0">
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        class="sr-only peer"
                        [checked]="page.isEnabled"
                        (change)="togglePage(page)"
                      />
                      <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                      <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                    </label>

                    <a
                      [routerLink]="['/store-builder/pages', page.id]"
                      class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Edit Sections
                    </a>

                    @if (page.pageType === 'Custom') {
                      <button
                        (click)="deletePage(page)"
                        class="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    }
                  </div>
                </div>
              </div>
            } @empty {
              <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
                <p class="text-gray-500">No pages found. Create a custom page to get started.</p>
              </div>
            }
          </div>
        }
      </div>

      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Create Custom Page</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">English Title</label>
                <input
                  type="text"
                  [(ngModel)]="newTitle"
                  placeholder="About Us"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Arabic Title</label>
                <input
                  type="text"
                  [(ngModel)]="newTitleAr"
                  placeholder="من نحن"
                  dir="rtl"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  [(ngModel)]="newSlug"
                  placeholder="about-us"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
                <p class="mt-1 text-xs text-gray-500">URL-friendly identifier (e.g., about-us)</p>
              </div>
              @if (createErr()) {
                <p class="text-sm text-red-700">{{ createErr() }}</p>
              }
            </div>
            <div class="flex justify-end gap-3 mt-5">
              <button
                (click)="closeCreateModal()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="confirmCreate()"
                [disabled]="creating()"
                class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {{ creating() ? 'Creating...' : 'Create Page' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PagesManagerComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  creating = signal(false);
  loadErr = signal<string | null>(null);
  createErr = signal<string | null>(null);
  showCreateModal = signal(false);
  pages = signal<PageConfigurationDto[]>([]);

  newTitle = '';
  newTitleAr = '';
  newSlug = '';

  ngOnInit(): void {
    this.loadPages();
  }

  loadPages(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loadErr.set('No store selected');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.builderService.getPages(storeId).subscribe({
      next: (pages) => {
        // Product landing pages are edited from the product form, not this general list.
        this.pages.set(pages.filter(p => p.pageType !== 'ProductLanding'));
        this.loading.set(false);
      },
      error: (err) => {
        this.loadErr.set(err.message || 'Failed to load pages');
        this.loading.set(false);
      }
    });
  }

  togglePage(page: PageConfigurationDto): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    const updated = { ...page, isEnabled: !page.isEnabled };
    const req: UpdatePageConfigurationRequest = {
      title: updated.title,
      slug: updated.slug,
      isEnabled: updated.isEnabled,
      seoSettings: updated.seoSettings,
      contentJson: updated.contentJson,
    };

    this.builderService.updatePage(storeId, page.id, req).subscribe({
      next: (result) => {
        this.pages.update(list => list.map(p => p.id === result.id ? result : p));
      },
      error: () => {}
    });
  }

  deletePage(page: PageConfigurationDto): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;
    this.builderService.deleteCustomPage(storeId, page.id).subscribe({
      next: () => this.loadPages(),
      error: () => {}
    });
  }

  openCreateModal(): void {
    this.newTitle = '';
    this.newTitleAr = '';
    this.newSlug = '';
    this.createErr.set(null);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  confirmCreate(): void {
    if (!this.newTitle.trim() || !this.newSlug.trim()) {
      this.createErr.set('English title and slug are required');
      return;
    }
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.creating.set(true);
    this.createErr.set(null);

    const req: CreateCustomPageRequest = {
      title: { english: this.newTitle.trim(), arabic: this.newTitleAr.trim() },
      slug: this.newSlug.trim(),
    };

    this.builderService.createCustomPage(storeId, req).subscribe({
      next: () => {
        this.creating.set(false);
        this.closeCreateModal();
        this.loadPages();
      },
      error: (err) => {
        this.creating.set(false);
        this.createErr.set(err.message || 'Failed to create page');
      }
    });
  }
}
