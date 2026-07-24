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
  templateUrl: './pages-manager.component.html',
  styleUrl: './pages-manager.component.scss'
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
