import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../core/services/store-context.service';
import { BuilderService } from './services/builder.service';
import { FaqItemDto, BilingualText } from 'shared';

@Component({
  selector: 'app-faq-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header with Add Button -->
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">FAQ Management</h3>
        <button
          (click)="onAddFaq()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add FAQ Item
        </button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-lg shadow p-8 text-center">
          <p class="text-gray-500">Loading FAQ items...</p>
        </div>
      }

      <!-- FAQ List -->
      @if (!loading()) {
        <div class="space-y-3">
          @for (faq of faqItems(); track faq.id; let idx = $index) {
            <div class="bg-white rounded-lg shadow p-4">
              @if (editingId() === faq.id) {
                <!-- Edit Mode -->
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">English Question</label>
                      <input
                        type="text"
                        [(ngModel)]="editForm.question.english"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Arabic Question</label>
                      <input
                        type="text"
                        [(ngModel)]="editForm.question.arabic"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">English Answer</label>
                      <textarea
                        [(ngModel)]="editForm.answer.english"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Arabic Answer</label>
                      <textarea
                        [(ngModel)]="editForm.answer.arabic"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      [(ngModel)]="editForm.isPublished"
                      id="edit-published-{{ faq.id }}"
                      class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label [for]="'edit-published-' + faq.id" class="ml-2 text-sm font-medium text-gray-700">
                      Published
                    </label>
                  </div>
                  <div class="flex justify-end gap-3">
                    <button
                      (click)="cancelEdit()"
                      class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      (click)="saveEdit(faq.id)"
                      [disabled]="saving()"
                      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {{ saving() ? 'Saving...' : 'Save' }}
                    </button>
                  </div>
                </div>
              } @else {
                <!-- View Mode -->
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h4 class="text-base font-medium text-gray-900">
                        {{ faq.question.english }}
                      </h4>
                      @if (faq.isPublished) {
                        <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Published
                        </span>
                      } @else {
                        <span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Draft
                        </span>
                      }
                      <span class="text-xs text-gray-500">
                        Order: {{ faq.sortOrder }}
                      </span>
                    </div>
                    @if (faq.question.arabic) {
                      <p class="text-sm text-gray-600 mb-2">{{ faq.question.arabic }}</p>
                    }
                    <p class="text-sm text-gray-700 mt-2">{{ faq.answer.english }}</p>
                    @if (faq.answer.arabic) {
                      <p class="text-sm text-gray-600 mt-1">{{ faq.answer.arabic }}</p>
                    }
                  </div>

                  <div class="flex items-center gap-2 ml-4">
                    <!-- Move Up/Down -->
                    <button
                      (click)="moveUp(idx)"
                      [disabled]="idx === 0"
                      [class.opacity-50]="idx === 0"
                      class="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      </svg>
                    </button>
                    <button
                      (click)="moveDown(idx)"
                      [disabled]="idx === faqItems().length - 1"
                      [class.opacity-50]="idx === faqItems().length - 1"
                      class="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>

                    <!-- Edit Button -->
                    <button
                      (click)="startEdit(faq)"
                      class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Edit
                    </button>

                    <!-- Delete Button -->
                    <button
                      (click)="deleteFaq(faq)"
                      class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              }
            </div>
          } @empty {
            <div class="bg-gray-50 rounded-lg p-8 text-center">
              <p class="text-gray-500">No FAQ items yet. Click "Add FAQ Item" to create one.</p>
            </div>
          }
        </div>
      }

      <!-- Add New FAQ Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Add FAQ Item</h3>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">English Question *</label>
                  <input
                    type="text"
                    [(ngModel)]="newFaq.question.english"
                    placeholder="How do I track my order?"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Arabic Question</label>
                  <input
                    type="text"
                    [(ngModel)]="newFaq.question.arabic"
                    placeholder="كيف يمكنني تتبع طلبي؟"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">English Answer *</label>
                  <textarea
                    [(ngModel)]="newFaq.answer.english"
                    rows="4"
                    placeholder="You can track your order using..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Arabic Answer</label>
                  <textarea
                    [(ngModel)]="newFaq.answer.arabic"
                    rows="4"
                    placeholder="يمكنك تتبع طلبك باستخدام..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  [(ngModel)]="newFaq.isPublished"
                  id="new-published"
                  class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label for="new-published" class="ml-2 text-sm font-medium text-gray-700">
                  Published
                </label>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                (click)="closeAddModal()"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                (click)="confirmAddFaq()"
                [disabled]="saving()"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {{ saving() ? 'Creating...' : 'Create FAQ' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class FaqManagerComponent implements OnInit {
  private builderService = inject(BuilderService);
  private storeContext = inject(StoreContextService);

  faqItems = signal<FaqItemDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);
  showAddModal = signal(false);

  newFaq = {
    question: { arabic: '', english: '' },
    answer: { arabic: '', english: '' },
    isPublished: false
  };

  editForm = {
    question: { arabic: '', english: '' },
    answer: { arabic: '', english: '' },
    isPublished: false
  };

  ngOnInit(): void {
    this.loadFaqItems();
  }

  loadFaqItems(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.loading.set(true);
    this.builderService.getFaqItems(storeId).subscribe({
      next: (items) => {
        this.faqItems.set(items.sort((a, b) => a.sortOrder - b.sortOrder));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load FAQ items:', err);
        this.loading.set(false);
      }
    });
  }

  onAddFaq(): void {
    this.showAddModal.set(true);
    this.newFaq = {
      question: { arabic: '', english: '' },
      answer: { arabic: '', english: '' },
      isPublished: false
    };
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  confirmAddFaq(): void {
    if (!this.newFaq.question.english || !this.newFaq.answer.english) {
      alert('Please fill in the English question and answer');
      return;
    }

    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.saving.set(true);
    this.builderService.createFaqItem(storeId, this.newFaq).subscribe({
      next: () => {
        this.loadFaqItems();
        this.closeAddModal();
        this.saving.set(false);
      },
      error: (err) => {
        alert(`Failed to create FAQ item: ${err.message}`);
        this.saving.set(false);
      }
    });
  }

  startEdit(faq: FaqItemDto): void {
    this.editingId.set(faq.id);
    this.editForm = {
      question: { ...faq.question },
      answer: { ...faq.answer },
      isPublished: faq.isPublished
    };
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(faqId: string): void {
    if (!this.editForm.question.english || !this.editForm.answer.english) {
      alert('Please fill in the English question and answer');
      return;
    }

    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.saving.set(true);
    this.builderService.updateFaqItem(storeId, faqId, this.editForm).subscribe({
      next: () => {
        this.loadFaqItems();
        this.editingId.set(null);
        this.saving.set(false);
      },
      error: (err) => {
        alert(`Failed to update FAQ item: ${err.message}`);
        this.saving.set(false);
      }
    });
  }

  deleteFaq(faq: FaqItemDto): void {
    if (!confirm(`Are you sure you want to delete "${faq.question.english}"?`)) {
      return;
    }

    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.builderService.deleteFaqItem(storeId, faq.id).subscribe({
      next: () => {
        this.loadFaqItems();
      },
      error: (err) => {
        alert(`Failed to delete FAQ item: ${err.message}`);
      }
    });
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const items = [...this.faqItems()];
    [items[index], items[index - 1]] = [items[index - 1], items[index]];
    this.updateSortOrders(items);
  }

  moveDown(index: number): void {
    const items = [...this.faqItems()];
    if (index === items.length - 1) return;
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    this.updateSortOrders(items);
  }

  private updateSortOrders(items: FaqItemDto[]): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    items.forEach((item, index) => {
      if (item.sortOrder !== index + 1) {
        this.builderService.updateFaqItem(storeId, item.id, {
          question: item.question,
          answer: item.answer,
          isPublished: item.isPublished
        }).subscribe();
      }
    });

    this.faqItems.set(items);
  }
}
