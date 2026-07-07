import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { SectionEditorComponent } from '../section-editor.component';
import { PageConfigurationDto, SectionConfigurationDto, PageSeoSettings, UpdatePageConfigurationRequest, UpdateSectionsRequest } from 'shared';
import { environment } from '../../../../environments/environment';

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

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
        <div class="flex flex-col xl:flex-row gap-6 px-4 sm:px-6 lg:px-8 py-8">
          <!-- Editor column -->
          <div class="w-full xl:w-[600px] xl:flex-shrink-0">
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
              (sectionsChange)="onSectionsChange($event)"
              (close)="onClose()"
            />
          </div>

          <!-- Live preview column (large screens only) -->
          @if (previewUrl()) {
            <div class="hidden xl:flex flex-col flex-1 min-w-0">
              <div class="sticky top-6">
                <!-- Preview toolbar -->
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</span>
                  <div class="flex items-center gap-1">
                    <div class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                      <button type="button" (click)="setDevice('desktop')"
                        class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
                        [class.bg-blue-600]="device() === 'desktop'" [class.text-white]="device() === 'desktop'"
                        [class.text-gray-500]="device() !== 'desktop'" title="Desktop">Desktop</button>
                      <button type="button" (click)="setDevice('tablet')"
                        class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
                        [class.bg-blue-600]="device() === 'tablet'" [class.text-white]="device() === 'tablet'"
                        [class.text-gray-500]="device() !== 'tablet'" title="Tablet">Tablet</button>
                      <button type="button" (click)="setDevice('mobile')"
                        class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
                        [class.bg-blue-600]="device() === 'mobile'" [class.text-white]="device() === 'mobile'"
                        [class.text-gray-500]="device() !== 'mobile'" title="Mobile">Mobile</button>
                    </div>
                    <a [href]="rawPreviewUrl" target="_blank" rel="noopener"
                      class="p-1.5 text-gray-400 hover:text-blue-600" title="Open preview in new tab">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </a>
                  </div>
                </div>

                <!-- Device frame -->
                <div class="bg-gray-100 border border-gray-200 rounded-xl p-4 flex justify-center overflow-auto"
                  style="height: calc(100vh - 8rem);">
                  <iframe
                    #previewFrame
                    [src]="previewUrl()"
                    (load)="onFrameLoad()"
                    class="bg-white rounded-lg shadow-sm border border-gray-200 h-full transition-all duration-200"
                    [style.width]="deviceWidth()"
                    style="max-width: 100%;"
                    title="Storefront live preview"
                  ></iframe>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class PageSectionsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLIFrameElement>;

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);
  page = signal<PageConfigurationDto | null>(null);

  device = signal<PreviewDevice>('desktop');
  previewUrl = signal<SafeResourceUrl | null>(null);
  rawPreviewUrl = '';

  private previewOrigin = '*';
  private currentSections: SectionConfigurationDto[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly messageListener = (e: MessageEvent) => this.onPreviewMessage(e);

  private readonly deviceWidths: Record<PreviewDevice, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px'
  };

  ngOnInit(): void {
    window.addEventListener('message', this.messageListener);

    const pageId = this.route.snapshot.paramMap.get('pageId');
    const storeId = this.storeContext.currentStoreId();

    if (!storeId || !pageId) {
      this.loadErr.set('Missing store or page identifier');
      this.loading.set(false);
      return;
    }

    this.setupPreviewUrl();

    this.builderService.getPages(storeId).subscribe({
      next: (pages) => {
        const found = pages.find(p => p.id === pageId) ?? null;
        if (!found) {
          this.loadErr.set('Page not found');
        } else {
          this.page.set(found);
          this.currentSections = [...(found.sections ?? [])];
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loadErr.set(err.message || 'Failed to load pages');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageListener);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private setupPreviewUrl(): void {
    const store = this.storeContext.currentStore();
    const slug = store?.slug ?? '';
    if (!slug) return;

    let origin: string;
    let url: string;
    if (!environment.production) {
      origin = 'http://localhost:4201';
      url = `${origin}/__preview?slug=${encodeURIComponent(slug)}`;
    } else {
      const host = store?.customDomain || `${slug}.qaflaty.com`;
      origin = `https://${host}`;
      url = `${origin}/__preview`;
    }
    this.previewOrigin = origin;
    this.rawPreviewUrl = url;
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  deviceWidth(): string {
    return this.deviceWidths[this.device()];
  }

  setDevice(device: PreviewDevice): void {
    this.device.set(device);
  }

  onFrameLoad(): void {
    // Fallback push in case the frame's 'ready' message is missed.
    this.pushToPreview();
  }

  private onPreviewMessage(event: MessageEvent): void {
    if (event.data?.type === 'qaflaty-preview-ready') {
      this.pushToPreview();
    }
  }

  onSectionsChange(sections: SectionConfigurationDto[]): void {
    this.currentSections = sections;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.pushToPreview(), 150);
  }

  private pushToPreview(): void {
    const frame = this.previewFrame?.nativeElement;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(
      { type: 'qaflaty-preview', sections: this.currentSections },
      this.previewOrigin
    );
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
          next: (updated) => {
            this.saving.set(false);
            this.saved.set(true);
            this.page.set(updated);
            setTimeout(() => this.saved.set(false), 2500);
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
