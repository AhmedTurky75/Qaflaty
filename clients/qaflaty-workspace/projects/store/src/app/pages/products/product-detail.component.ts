import { Component, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductBuyBoxComponent } from '../../components/products/product-buy-box.component';
import { ProductReviewsComponent } from '../../components/reviews/product-reviews.component';
import { ProductRowComponent } from '../../components/recommendations/product-row.component';
import { RecommendationService } from '../../services/recommendation.service';
import { I18nService } from '../../services/i18n.service';
import { TrackingService } from '../../services/tracking.service';
import { ConfigService } from '../../services/config.service';
import { CartService } from '../../services/cart.service';
import { DownsellService } from '../../services/downsell.service';

type ProductTab = 'description' | 'specifications' | 'reviews' | 'shipping';

/** How often the dwell-time downsell trigger checks in, and how long it keeps checking. */
const DWELL_CHECK_INTERVAL_MS = 15000;
const DWELL_MAX_CHECKS = 6; // stops asking after 90s on the page

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductBuyBoxComponent, ProductReviewsComponent, ProductRowComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnDestroy {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private recommendations = inject(RecommendationService);
  private i18n = inject(I18nService);
  private tracking = inject(TrackingService);
  private configService = inject(ConfigService);
  private cart = inject(CartService);
  private downsell = inject(DownsellService);

  private dwellTimer?: ReturnType<typeof setInterval>;
  private dwellElapsedSeconds = 0;
  private dwellChecks = 0;
  private exitIntentFired = false;
  private readonly exitIntentHandler = (e: MouseEvent) => this.onExitIntent(e);

  product = signal<Product | null>(null);
  displayName = computed(() => this.i18n.nameFor(this.product()?.name, this.product()?.nameAr));

  activeTab = signal<ProductTab>('description');
  loading = signal<boolean>(true);

  // Recommendation sections
  relatedProducts = signal<Product[]>([]);
  frequentlyBoughtTogether = signal<Product[]>([]);
  upSellProducts = signal<Product[]>([]);
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
    // Exit intent is a desktop-only signal (mouse leaving toward the browser chrome) —
    // touch devices have no such gesture.
    if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches) {
      document.addEventListener('mouseleave', this.exitIntentHandler);
    }

    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  ngOnDestroy() {
    document.removeEventListener('mouseleave', this.exitIntentHandler);
    this.stopDwellTimer();
  }

  loadProduct(slug: string) {
    this.loading.set(true);
    this.stopDwellTimer();
    this.exitIntentFired = false;

    this.productService.getProductBySlug(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.loadRecommendations(product.id);
        this.startDwellTimer(product.id);
        this.tracking.track('ViewContent', {
          value: product.price,
          currency: this.configService.config()?.currency,
          contents: [{ contentId: product.id, quantity: 1, price: product.price }]
        });
      },
      error: (error) => {
        console.error('Failed to load product:', error);
        this.loading.set(false);
      }
    });
  }

  private onExitIntent(e: MouseEvent) {
    if (this.exitIntentFired || e.clientY > 0) return;
    const productId = this.product()?.id;
    if (!productId || this.cart.hasItem(productId)) return;

    this.exitIntentFired = true;
    this.downsell.evaluate('ProductDetails', 'ExitIntentPdp', productId);
  }

  private startDwellTimer(productId: string) {
    this.dwellElapsedSeconds = 0;
    this.dwellChecks = 0;
    this.dwellTimer = setInterval(() => {
      this.dwellElapsedSeconds += DWELL_CHECK_INTERVAL_MS / 1000;
      this.dwellChecks++;

      if (this.cart.hasItem(productId) || this.dwellChecks >= DWELL_MAX_CHECKS) {
        this.stopDwellTimer();
        return;
      }

      this.downsell.evaluate('ProductDetails', 'DwellTimePdp', productId, this.dwellElapsedSeconds);
    }, DWELL_CHECK_INTERVAL_MS);
  }

  private stopDwellTimer() {
    if (this.dwellTimer) {
      clearInterval(this.dwellTimer);
      this.dwellTimer = undefined;
    }
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
    this.recommendations.getCrossSell(productId, 4).subscribe({
      next: (items) => this.frequentlyBoughtTogether.set(items),
      error: () => {}
    });
    this.recommendations.getUpSell(productId, 4).subscribe({
      next: (items) => this.upSellProducts.set(items),
      error: () => {}
    });
    this.recommendations.getTrending(8).subscribe({
      next: (items) => this.trendingProducts.set(items.filter(p => p.id !== productId)),
      error: () => {}
    });
  }
}
