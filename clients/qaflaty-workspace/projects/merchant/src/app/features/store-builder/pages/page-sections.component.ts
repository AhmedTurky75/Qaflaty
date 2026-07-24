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
  templateUrl: './page-sections.component.html',
  styleUrl: './page-sections.component.scss'
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
