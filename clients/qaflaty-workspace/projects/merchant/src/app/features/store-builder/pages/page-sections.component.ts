import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { SectionEditorComponent } from '../section-editor.component';
import { PageConfigurationDto, SectionConfigurationDto, PageSeoSettings, UpdatePageConfigurationRequest, UpdateSectionsRequest, PageVariantDto } from 'shared';
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

            <!-- A/B Testing panel -->
            <div class="bg-white rounded-lg shadow mt-6">
              <button type="button" (click)="showAb.set(!showAb())"
                class="w-full px-6 py-4 flex items-center justify-between text-left">
                <div>
                  <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
                    A/B Testing
                    <span class="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Beta</span>
                  </h3>
                  <p class="text-xs text-gray-500 mt-0.5">Split traffic between the current layout (control) and alternative variants</p>
                </div>
                <svg class="w-5 h-5 text-gray-400 transition-transform" [class.rotate-180]="showAb()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              @if (showAb()) {
                <div class="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
                  <!-- Control row -->
                  <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                      <p class="text-sm font-medium text-gray-900">Control (current layout)</p>
                      <p class="text-xs text-gray-500">Weight {{ controlWeight }} · always active</p>
                    </div>
                    <span class="text-xs text-gray-400">baseline</span>
                  </div>

                  @for (v of variants(); track $index; let i = $index) {
                    <div class="rounded-lg border border-gray-200 px-4 py-3 space-y-3">
                      <div class="flex items-center gap-3">
                        <input type="text" [value]="v.name" (input)="setVariantField(i, 'name', asValue($event))"
                          class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md" placeholder="Variant name" />
                        <div class="flex items-center gap-1">
                          <label class="text-xs text-gray-500">Weight</label>
                          <input type="number" min="0" [value]="v.weight" (input)="setVariantField(i, 'weight', +asValue($event))"
                            class="w-16 text-sm px-2 py-1.5 border border-gray-300 rounded-md" />
                        </div>
                        <label class="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" [checked]="v.isActive" (change)="setVariantField(i, 'isActive', asChecked($event))"
                            class="h-4 w-4 text-blue-600 rounded" />
                          <span class="text-xs text-gray-600">Active</span>
                        </label>
                        <button type="button" (click)="removeVariant(i)" class="text-red-400 hover:text-red-600" title="Delete variant">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                      <div class="flex items-center gap-4 text-xs text-gray-500">
                        <span>{{ v.impressions }} impressions</span>
                        <span>{{ v.conversions }} conversions</span>
                        <span class="font-medium text-gray-700">{{ conversionRate(v) }} CVR</span>
                        <span class="ms-auto text-gray-400">{{ splitShare(v) }} of traffic</span>
                      </div>
                    </div>
                  } @empty {
                    <p class="text-sm text-gray-500">No variants yet. Add one from the current layout to start a test.</p>
                  }

                  <div class="flex items-center gap-3 pt-1">
                    <button type="button" (click)="addVariantFromCurrent()"
                      class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                      + New variant from current layout
                    </button>
                    <button type="button" (click)="saveVariants()" [disabled]="abSaving()"
                      class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                      {{ abSaving() ? 'Saving…' : 'Save Variants' }}
                    </button>
                    @if (abSaved()) { <span class="text-xs text-green-600">Saved.</span> }
                    @if (abErr()) { <span class="text-xs text-red-600">{{ abErr() }}</span> }
                  </div>
                  <p class="text-[11px] text-gray-400">A variant snapshots the current layout when created. Metrics are placeholder counters pending the full analytics pipeline.</p>
                </div>
              }
            </div>
          </div>

          <!-- Live preview column (large screens only) -->
          @if (previewUrl()) {
            <div [class]="previewExpanded()
              ? 'fixed inset-0 z-50 bg-white flex flex-col p-4'
              : 'hidden xl:flex flex-col flex-1 min-w-0'">
              <div [class]="previewExpanded() ? 'flex flex-col h-full' : 'sticky top-6'">
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
                    <button type="button" (click)="previewExpanded.set(!previewExpanded())"
                      class="p-1.5 text-gray-400 hover:text-blue-600"
                      [title]="previewExpanded() ? 'Exit fullscreen preview' : 'Expand preview to full width (desktop needs real screen width to look right)'">
                      @if (previewExpanded()) {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9L4 4m0 0v4m0-4h4m7 5l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4m6-4l5 5m0 0v-4m0 4h-4"></path>
                        </svg>
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h4m0 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                      }
                    </button>
                    <button type="button" (click)="openPopoutPreview()"
                      class="p-1.5 text-gray-400 hover:text-blue-600" title="Pop out into its own live-updating window">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Device frame -->
                <div class="bg-gray-100 border border-gray-200 rounded-xl p-4 flex justify-center overflow-auto flex-1"
                  [style.height]="previewExpanded() ? 'auto' : 'calc(100vh - 8rem)'">
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
                <p class="mt-2 text-[11px] text-gray-400 truncate">
                  Previewing <span class="font-mono">{{ rawPreviewUrl }}</span> — the storefront app must be running there.
                  A real desktop layout needs real screen width: use the expand (⛶) or pop-out (↗) button above rather than judging it in this ~600px-narrower split view.
                </p>
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
  /** Overlays the preview at full viewport width — the split editor+preview
   *  layout only leaves the preview column ~half the screen (less, once the
   *  merchant dashboard's own nav is subtracted), so "Desktop" mode there
   *  renders at roughly tablet width. Expanding removes that constraint. */
  previewExpanded = signal(false);
  private previewWindow: Window | null = null;

  // A/B testing
  readonly controlWeight = 1;
  showAb = signal(false);
  variants = signal<PageVariantDto[]>([]);
  abSaving = signal(false);
  abSaved = signal(false);
  abErr = signal<string | null>(null);

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
          this.loadVariants(storeId, found.id);
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

    // Prefer an explicitly configured storefront origin (must be the STORE app,
    // not the merchant app). Fall back to deriving it from the store's domain.
    const configured = (environment as { storeBaseUrl?: string }).storeBaseUrl?.trim();
    let origin: string;
    if (configured) {
      origin = configured.replace(/\/+$/, '');
    } else {
      const host = store?.customDomain || `${slug}.qaflaty.com`;
      origin = `https://${host}`;
    }

    const url = `${origin}/__preview?slug=${encodeURIComponent(slug)}`;
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
    const message = { type: 'qaflaty-preview', sections: this.currentSections };
    const frame = this.previewFrame?.nativeElement;
    if (frame?.contentWindow) {
      frame.contentWindow.postMessage(message, this.previewOrigin);
    }
    if (this.previewWindow && !this.previewWindow.closed) {
      this.previewWindow.postMessage(message, this.previewOrigin);
    }
  }

  /** Opens the live preview in its own real browser window (resizable, can be
   *  put on a second monitor) instead of the constrained in-page split view;
   *  keeps receiving live updates same as the embedded iframe does. */
  openPopoutPreview(): void {
    if (this.previewWindow && !this.previewWindow.closed) {
      this.previewWindow.focus();
      return;
    }
    this.previewWindow = window.open(this.rawPreviewUrl, 'qaflaty_live_preview', 'width=1440,height=900');
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

  // ── A/B testing ──
  asValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  asChecked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }

  private loadVariants(storeId: string, pageId: string): void {
    this.builderService.getPageVariants(storeId, pageId).subscribe({
      next: (v) => this.variants.set(v),
      error: () => { /* variants are optional; ignore load errors */ }
    });
  }

  addVariantFromCurrent(): void {
    const next: PageVariantDto = {
      id: '',
      name: `Variant ${String.fromCharCode(66 + this.variants().length)}`, // B, C, D…
      weight: 1,
      isActive: true,
      sectionsJson: JSON.stringify(this.currentSections),
      impressions: 0,
      conversions: 0
    };
    this.variants.set([...this.variants(), next]);
    this.abSaved.set(false);
  }

  setVariantField(index: number, field: keyof PageVariantDto, value: unknown): void {
    const list = this.variants().map((v, i) => i === index ? { ...v, [field]: value } : v);
    this.variants.set(list);
    this.abSaved.set(false);
  }

  removeVariant(index: number): void {
    this.variants.set(this.variants().filter((_, i) => i !== index));
    this.abSaved.set(false);
  }

  conversionRate(v: PageVariantDto): string {
    if (!v.impressions) return '0%';
    return `${((v.conversions / v.impressions) * 100).toFixed(1)}%`;
  }

  splitShare(v: PageVariantDto): string {
    if (!v.isActive || v.weight <= 0) return '0%';
    const total = this.controlWeight + this.variants()
      .filter(x => x.isActive && x.weight > 0)
      .reduce((sum, x) => sum + x.weight, 0);
    return total ? `${Math.round((v.weight / total) * 100)}%` : '0%';
  }

  saveVariants(): void {
    const storeId = this.storeContext.currentStoreId();
    const page = this.page();
    if (!storeId || !page) return;

    this.abSaving.set(true);
    this.abSaved.set(false);
    this.abErr.set(null);

    this.builderService.updatePageVariants(storeId, page.id, { variants: this.variants() }).subscribe({
      next: (saved) => {
        this.variants.set(saved);
        this.abSaving.set(false);
        this.abSaved.set(true);
        setTimeout(() => this.abSaved.set(false), 2500);
      },
      error: (err) => {
        this.abSaving.set(false);
        this.abErr.set(err?.message || 'Failed to save variants');
      }
    });
  }
}
