import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageConfigurationDto } from 'shared';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-editor.component.html',
  styleUrl: './page-editor.component.scss'
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
