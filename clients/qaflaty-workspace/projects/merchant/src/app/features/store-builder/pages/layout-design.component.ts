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
  templateUrl: './layout-design.component.html',
  styleUrl: './layout-design.component.scss'
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
