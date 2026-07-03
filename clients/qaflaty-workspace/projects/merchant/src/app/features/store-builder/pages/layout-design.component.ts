import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService, LayoutVariantDto } from '../services/builder.service';
import { StoreConfigurationDto, UpdateStoreConfigurationRequest } from 'shared';

@Component({
  selector: 'app-layout-design',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <a [routerLink]="'/store-builder'" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </a>
          <h1 class="text-lg font-semibold text-gray-900">Layout & Design</h1>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading()) {
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500">Loading configuration...</p>
          </div>
        }

        @if (loadErr()) {
          <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700">{{ loadErr() }}</p>
          </div>
        }

        @if (!loading() && localConfig) {
          <div class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 class="text-base font-semibold text-gray-900 mb-5">Layout Variants</h2>
              <div class="space-y-5">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Header Style</label>
                  <select
                    [(ngModel)]="localConfig!.headerVariant"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    @for (v of headerVariants(); track v.id) {
                      <option [value]="v.code">{{ v.nameEn }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Footer Style</label>
                  <select
                    [(ngModel)]="localConfig!.footerVariant"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    @for (v of footerVariants(); track v.id) {
                      <option [value]="v.code">{{ v.nameEn }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Product Card Style</label>
                  <select
                    [(ngModel)]="localConfig!.productCardVariant"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    @for (v of cardVariants(); track v.id) {
                      <option [value]="v.code">{{ v.nameEn }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Product Grid Layout</label>
                  <select
                    [(ngModel)]="localConfig!.productGridVariant"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    @for (v of gridVariants(); track v.id) {
                      <option [value]="v.code">{{ v.nameEn }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            @if (saved()) {
              <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p class="text-green-700 text-sm font-medium">Layout saved successfully.</p>
              </div>
            }
            @if (saveErr()) {
              <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p class="text-red-700 text-sm">{{ saveErr() }}</p>
              </div>
            }

            <div class="flex justify-end">
              <button
                (click)="save()"
                [disabled]="saving()"
                class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class LayoutDesignComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);

  variants = signal<LayoutVariantDto[]>([]);
  headerVariants = computed(() => this.variants().filter(v => v.type === 'Header'));
  footerVariants = computed(() => this.variants().filter(v => v.type === 'Footer'));
  cardVariants = computed(() => this.variants().filter(v => v.type === 'ProductCard'));
  gridVariants = computed(() => this.variants().filter(v => v.type === 'ProductGrid'));

  localConfig: StoreConfigurationDto | null = null;

  // Stored values from before the catalog existed used PascalCase ids that the storefront no
  // longer matches. Normalise them to the canonical codes so the dropdown pre-selects correctly;
  // saving then persists the canonical code and the drift is gone. Mirrors the storefront's
  // feature.service legacy maps (one per slot — the PascalCase ids overlap between slots).
  private readonly legacyHeader: Record<string, string> = {
    Centered: 'header-centered', LeftAligned: 'header-full',
    MinimalCentered: 'header-minimal', SplitNavigation: 'header-sidebar',
  };
  private readonly legacyFooter: Record<string, string> = {
    FourColumn: 'footer-standard', ThreeColumn: 'footer-centered',
    Minimal: 'footer-minimal', Stacked: 'footer-standard',
  };
  private readonly legacyCard: Record<string, string> = {
    Standard: 'card-standard', Compact: 'card-minimal',
    Detailed: 'card-detailed', WithHover: 'card-overlay',
  };
  private readonly legacyGrid: Record<string, string> = {
    TwoColumn: 'grid-2', ThreeColumn: 'grid-3', FourColumn: 'grid-4',
    Masonry: 'grid-masonry', 'grid-standard': 'grid-3',
  };

  ngOnInit(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loadErr.set('No store selected');
      this.loading.set(false);
      return;
    }
    forkJoin({
      config: this.builderService.getConfiguration(storeId),
      variants: this.builderService.getLayoutVariants(),
    }).subscribe({
      next: ({ config, variants }) => {
        this.variants.set(variants);
        const cfg: StoreConfigurationDto = JSON.parse(JSON.stringify(config));
        cfg.headerVariant = this.legacyHeader[cfg.headerVariant] ?? cfg.headerVariant;
        cfg.footerVariant = this.legacyFooter[cfg.footerVariant] ?? cfg.footerVariant;
        cfg.productCardVariant = this.legacyCard[cfg.productCardVariant] ?? cfg.productCardVariant;
        cfg.productGridVariant = this.legacyGrid[cfg.productGridVariant] ?? cfg.productGridVariant;
        this.localConfig = cfg;
        this.loading.set(false);
      },
      error: (err) => {
        this.loadErr.set(err.message || 'Failed to load configuration');
        this.loading.set(false);
      }
    });
  }

  save(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.localConfig) return;
    this.saving.set(true);
    this.saved.set(false);
    this.saveErr.set(null);

    const req: UpdateStoreConfigurationRequest = {
      pageToggles: this.localConfig.pageToggles,
      featureToggles: this.localConfig.featureToggles,
      customerAuthSettings: this.localConfig.customerAuthSettings,
      communicationSettings: this.localConfig.communicationSettings,
      aiAssistantSettings: this.localConfig.aiAssistantSettings,
      localizationSettings: this.localConfig.localizationSettings,
      socialLinks: this.localConfig.socialLinks,
      headerVariant: this.localConfig.headerVariant,
      footerVariant: this.localConfig.footerVariant,
      productCardVariant: this.localConfig.productCardVariant,
      productGridVariant: this.localConfig.productGridVariant,
    };

    this.builderService.updateConfiguration(storeId, req).subscribe({
      next: (config) => {
        this.localConfig = JSON.parse(JSON.stringify(config));
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveErr.set(err.message || 'Failed to save layout');
      }
    });
  }
}
