import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageConfigurationDto } from 'shared';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header with Create Button -->
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">Pages</h3>
        <button
          (click)="onCreateCustomPage()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Custom Page
        </button>
      </div>

      <!-- Pages List -->
      <div class="space-y-3">
        @for (page of pages; track page.id) {
          <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h4 class="text-base font-medium text-gray-900">
                  {{ page.title.english }}
                  @if (page.title.arabic) {
                    <span class="text-gray-500 text-sm"> ({{ page.title.arabic }})</span>
                  }
                </h4>
                <p class="text-sm text-gray-500 mt-1">
                  Page Type: {{ page.pageType }} | Slug: /{{ page.slug }}
                </p>
              </div>

              <div class="flex items-center gap-4">
                <!-- Enable/Disable Toggle -->
                <div class="flex items-center">
                  <label class="text-sm font-medium text-gray-700 mr-2">Enabled</label>
                  <input
                    type="checkbox"
                    [(ngModel)]="page.isEnabled"
                    (change)="onPageToggle(page)"
                    class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- Edit Button -->
                <button
                  (click)="onEditPage(page)"
                  class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Edit Sections
                </button>

                <!-- Delete Button (only for Custom pages) -->
                @if (page.pageType === 'Custom') {
                  <button
                    (click)="onDeletePage(page)"
                    class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Delete
                  </button>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="bg-gray-50 rounded-lg p-8 text-center">
            <p class="text-gray-500">No pages found. Click "Create Custom Page" to add a new page.</p>
          </div>
        }
      </div>

      <!-- Create Custom Page Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Create Custom Page</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">English Title</label>
                <input
                  type="text"
                  [(ngModel)]="newPage.title.english"
                  placeholder="About Us"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Arabic Title</label>
                <input
                  type="text"
                  [(ngModel)]="newPage.title.arabic"
                  placeholder="من نحن"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                <input
                  type="text"
                  [(ngModel)]="newPage.slug"
                  placeholder="about-us"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p class="mt-1 text-xs text-gray-500">URL-friendly name (e.g., about-us)</p>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                (click)="closeCreateModal()"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                (click)="confirmCreatePage()"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Page
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PageEditorComponent {
  @Input() pages: PageConfigurationDto[] = [];
  @Output() editPage = new EventEmitter<PageConfigurationDto>();
  @Output() togglePage = new EventEmitter<PageConfigurationDto>();
  @Output() deletePage = new EventEmitter<PageConfigurationDto>();
  @Output() createPage = new EventEmitter<{ title: { arabic: string; english: string }; slug: string }>();

  showCreateModal = signal(false);
  newPage = {
    title: { arabic: '', english: '' },
    slug: ''
  };

  onEditPage(page: PageConfigurationDto): void {
    this.editPage.emit(page);
  }

  onPageToggle(page: PageConfigurationDto): void {
    this.togglePage.emit(page);
  }

  onDeletePage(page: PageConfigurationDto): void {
    if (confirm(`Are you sure you want to delete the page "${page.title.english}"?`)) {
      this.deletePage.emit(page);
    }
  }

  onCreateCustomPage(): void {
    this.showCreateModal.set(true);
    this.newPage = {
      title: { arabic: '', english: '' },
      slug: ''
    };
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  confirmCreatePage(): void {
    if (!this.newPage.title.english || !this.newPage.slug) {
      alert('Please fill in the English title and slug');
      return;
    }
    this.createPage.emit({ ...this.newPage });
    this.closeCreateModal();
  }
}
