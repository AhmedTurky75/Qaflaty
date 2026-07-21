import { Component, inject, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { PageConfigurationDto } from 'shared';
import { ProductBuyBoxComponent } from '../../components/products/product-buy-box.component';
import { ProductRowComponent } from '../../components/recommendations/product-row.component';
import { SectionRendererComponent } from '../../components/sections/section-renderer.component';
import { RecommendationService } from '../../services/recommendation.service';
import { SeoService } from '../../services/seo.service';
import { PresenceService } from '../../services/presence.service';

/**
 * Professional, merchant-configurable landing layout for a single product: buy box, then the
 * product's PageConfiguration sections rendered via SectionRendererComponent, then fixed
 * recommendation rows (bundle upsell + related products).
 */
@Component({
  selector: 'app-product-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductBuyBoxComponent, ProductRowComponent, SectionRendererComponent],
  templateUrl: './product-landing.component.html',
  styleUrls: ['./product-landing.component.css']
})
export class ProductLandingComponent {
  pageConfig = input.required<PageConfigurationDto>();
  productSlug = input.required<string>();

  private productService = inject(ProductService);
  private recommendations = inject(RecommendationService);
  private seo = inject(SeoService);
  private presence = inject(PresenceService);

  product = signal<Product | null>(null);
  loading = signal<boolean>(true);

  bundleProducts = signal<Product[]>([]);
  relatedProducts = signal<Product[]>([]);

  enabledSections = computed(() => this.pageConfig().sections.filter(s => s.isEnabled));

  ngOnInit() {
    this.loadProduct();
    if (this.pageConfig().seoSettings) {
      this.seo.setPageSeo(this.pageConfig().seoSettings, this.pageConfig().title);
    }
  }

  private loadProduct() {
    this.loading.set(true);
    this.productService.getProductBySlug(this.productSlug()).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.loadRecommendations(product.id);
        // Count this visitor against this product's live viewer total (merchant dashboard) — the
        // landing layout previously never did this, so product pages showed 0 live viewers.
        this.presence.onViewProduct(product.id);
      },
      error: (error) => {
        console.error('Failed to load product:', error);
        this.loading.set(false);
      }
    });
  }

  scrollToReviews() {
    setTimeout(() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  private loadRecommendations(productId: string) {
    this.recommendations.trackView(productId).subscribe({ next: () => {}, error: () => {} });
    this.recommendations.getFrequentlyBoughtTogether(productId, 4).subscribe({
      next: (items) => this.bundleProducts.set(items),
      error: () => {}
    });
    this.recommendations.getRelated(productId, 8).subscribe({
      next: (items) => this.relatedProducts.set(items),
      error: () => {}
    });
  }
}
