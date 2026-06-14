import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { SectionEditorComponent } from '../section-editor.component';
import { PageConfigurationDto, SectionConfigurationDto, PageSeoSettings, UpdatePageConfigurationRequest, UpdateSectionsRequest } from 'shared';

@Component({
  selector: 'app-page-sections',
  standalone: true,
  imports: [SectionEditorComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      @if (loading()) {
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500">Loading page...</p>
          </div>
        </div>
      }

      @if (loadErr()) {
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700">{{ loadErr() }}</p>
          </div>
        </div>
      }

      @if (!loading() && !loadErr() && page()) {
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          @if (saving()) {
            <div class="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <p class="text-blue-700 text-sm">Saving...</p>
            </div>
          }
          @if (saved()) {
            <div class="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p class="text-green-700 text-sm font-medium">Page saved successfully.</p>
            </div>
          }
          @if (saveErr()) {
            <div class="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p class="text-red-700 text-sm">{{ saveErr() }}</p>
            </div>
          }
          <app-section-editor
            [page]="page()"
            (save)="onSave($event)"
            (close)="onClose()"
          />
        </div>
      }
    </div>
  `
})
export class PageSectionsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);
  page = signal<PageConfigurationDto | null>(null);

  ngOnInit(): void {
    const pageId = this.route.snapshot.paramMap.get('pageId');
    const storeId = this.storeContext.currentStoreId();

    if (!storeId || !pageId) {
      this.loadErr.set('Missing store or page identifier');
      this.loading.set(false);
      return;
    }

    this.builderService.getPages(storeId).subscribe({
      next: (pages) => {
        const found = pages.find(p => p.id === pageId) ?? null;
        if (!found) {
          this.loadErr.set('Page not found');
        } else {
          this.page.set(found);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loadErr.set(err.message || 'Failed to load pages');
        this.loading.set(false);
      }
    });
  }

  onSave(data: { sections: SectionConfigurationDto[]; seoSettings: PageSeoSettings }): void {
    const storeId = this.storeContext.currentStoreId();
    const current = this.page();
    if (!storeId || !current) return;

    this.saving.set(true);
    this.saved.set(false);
    this.saveErr.set(null);

    const sectionsReq: UpdateSectionsRequest = { sections: data.sections };
    const pageReq: UpdatePageConfigurationRequest = {
      title: current.title,
      slug: current.slug,
      isEnabled: current.isEnabled,
      seoSettings: data.seoSettings,
      contentJson: current.contentJson,
    };

    this.builderService.updateSections(storeId, current.id, sectionsReq).subscribe({
      next: () => {
        this.builderService.updatePage(storeId, current.id, pageReq).subscribe({
          next: () => {
            this.saving.set(false);
            this.saved.set(true);
            setTimeout(() => {
              this.router.navigate(['/store-builder/pages']);
            }, 1200);
          },
          error: (err) => {
            this.saving.set(false);
            this.saveErr.set(err.message || 'Failed to update page SEO');
          }
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.saveErr.set(err.message || 'Failed to update sections');
      }
    });
  }

  onClose(): void {
    this.router.navigate(['/store-builder/pages']);
  }
}
