import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../core/services/store-context.service';
import { BuilderService } from './services/builder.service';
import { FaqItemDto } from 'shared';

@Component({
  selector: 'app-faq-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq-manager.component.html',
  styleUrl: './faq-manager.component.scss'
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
