import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductBuyBoxComponent } from '../../components/products/product-buy-box.component';
import { ProductReviewsComponent } from '../../components/reviews/product-reviews.component';
import { ProductRowComponent } from '../../components/recommendations/product-row.component';
import { RecommendationService } from '../../services/recommendation.service';
import { I18nService } from '../../services/i18n.service';

type ProductTab = 'description' | 'specifications' | 'reviews' | 'shipping';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductBuyBoxComponent, ProductReviewsComponent, ProductRowComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private recommendations = inject(RecommendationService);
  private i18n = inject(I18nService);

  product = signal<Product | null>(null);
  displayName = computed(() => this.i18n.nameFor(this.product()?.name, this.product()?.nameAr));

  activeTab = signal<ProductTab>('description');
  loading = signal<boolean>(true);

  // Recommendation sections
  relatedProducts = signal<Product[]>([]);
  frequentlyBoughtTogether = signal<Product[]>([]);
  recentlyViewed = signal<Product[]>([]);
  trendingProducts = signal<Product[]>([]);

  setTab(tab: ProductTab) {
    this.activeTab.set(tab);
  }

  scrollToReviews() {
    this.activeTab.set('reviews');
    setTimeout(() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  loadProduct(slug: string) {
    this.loading.set(true);
    this.productService.getProductBySlug(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.loadRecommendations(product.id);
      },
      error: (error) => {
        console.error('Failed to load product:', error);
        this.loading.set(false);
      }
    });
  }

  private loadRecommendations(productId: string) {
    // Track this view (fire-and-forget), then load recently-viewed which depends on it.
    this.recommendations.trackView(productId).subscribe({
      next: () => this.recommendations.getRecentlyViewed(12).subscribe({
        next: (items) => this.recentlyViewed.set(items.filter(p => p.id !== productId)),
        error: () => {}
      }),
      error: () => {}
    });

    this.recommendations.getRelated(productId, 8).subscribe({
      next: (items) => this.relatedProducts.set(items),
      error: () => {}
    });
    this.recommendations.getFrequentlyBoughtTogether(productId, 4).subscribe({
      next: (items) => this.frequentlyBoughtTogether.set(items),
      error: () => {}
    });
    this.recommendations.getTrending(8).subscribe({
      next: (items) => this.trendingProducts.set(items.filter(p => p.id !== productId)),
      error: () => {}
    });
  }
}
