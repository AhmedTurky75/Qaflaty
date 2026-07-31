import { Component, Input, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { ProductService } from '../../services/product.service';
import { BuilderService } from '../../../store-builder/services/builder.service';
import { StoreContextService } from '../../../../core/services/store-context.service';
import { PageConfigurationDto } from 'shared';

@Component({
  selector: 'app-landing-page-panel',
  standalone: true,
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './landing-page-panel.component.html',
  styleUrl: './landing-page-panel.component.scss',
})
export class LandingPagePanelComponent implements OnChanges {
  @Input() productId: string | null = null;

  private productService = inject(ProductService);
  private builderService = inject(BuilderService);
  private storeContext = inject(StoreContextService);
  private transloco = inject(TranslocoService);

  loading = signal(false);
  creating = signal(false);
  error = signal<string | null>(null);
  page = signal<PageConfigurationDto | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && this.productId) {
      this.load();
    }
  }

  load(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.productId) return;

    this.loading.set(true);
    this.productService.getLandingPage(storeId, this.productId).subscribe({
      next: (page) => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.page.set(null);
        this.loading.set(false);
      }
    });
  }

  create(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.productId) return;

    this.creating.set(true);
    this.error.set(null);
    this.productService.createLandingPage(storeId, this.productId).subscribe({
      next: (page) => {
        this.page.set(page);
        this.creating.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create landing page');
        this.creating.set(false);
      }
    });
  }

  toggleEnabled(): void {
    const storeId = this.storeContext.currentStoreId();
    const current = this.page();
    if (!storeId || !current) return;

    const updated = { ...current, isEnabled: !current.isEnabled };
    this.builderService.updatePage(storeId, current.id, {
      title: current.title,
      slug: current.slug,
      isEnabled: updated.isEnabled,
      seoSettings: current.seoSettings,
      contentJson: current.contentJson
    }).subscribe({
      next: () => this.page.set(updated),
      error: (err) => this.error.set(err.error?.message || 'Failed to update landing page')
    });
  }

  delete(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.productId) return;
    if (!confirm(this.transloco.translate('products.landing.deleteConfirm'))) return;

    this.productService.deleteLandingPage(storeId, this.productId).subscribe({
      next: () => this.page.set(null),
      error: (err) => this.error.set(err.error?.message || 'Failed to delete landing page')
    });
  }
}
