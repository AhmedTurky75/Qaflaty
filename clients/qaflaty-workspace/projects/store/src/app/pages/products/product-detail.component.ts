import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product, ProductVariant } from '../../models/product.model';
import { VariantSelectorComponent } from '../../components/products/variant-selector.component';
import { WhatsAppButtonComponent } from '../../components/shared/whatsapp-button.component';
import { WhatsAppService } from '../../services/whatsapp.service';
import { ProductReviewsComponent } from '../../components/reviews/product-reviews.component';
import { ProductRowComponent } from '../../components/recommendations/product-row.component';
import { ProductGalleryComponent } from '../../components/products/product-gallery.component';
import { RecommendationService } from '../../services/recommendation.service';
import { ReviewService } from '../../services/review.service';
import { WishlistService } from '../../services/wishlist.service';
import { I18nService } from '../../services/i18n.service';

type ProductTab = 'description' | 'specifications' | 'reviews' | 'shipping';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, VariantSelectorComponent, WhatsAppButtonComponent, ProductReviewsComponent, ProductRowComponent, ProductGalleryComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private recommendations = inject(RecommendationService);
  private reviewService = inject(ReviewService);
  private wishlistService = inject(WishlistService);
  whatsAppService = inject(WhatsAppService);
  private i18n = inject(I18nService);

  product = signal<Product | null>(null);
  displayName = computed(() => this.i18n.nameFor(this.product()?.name, this.product()?.nameAr));

  // Rating summary (for header + social proof)
  averageRating = signal<number>(0);
  totalReviews = signal<number>(0);
  totalVerified = signal<number>(0);

  // UI state
  activeTab = signal<ProductTab>('description');
  showStickyBar = signal<boolean>(false);
  loading = signal<boolean>(true);
  quantity = signal<number>(1);
  addingToCart = signal<boolean>(false);
  showAddedMessage = signal<boolean>(false);
  selectedVariant = signal<ProductVariant | null>(null);

  // Recommendation sections
  relatedProducts = signal<Product[]>([]);
  frequentlyBoughtTogether = signal<Product[]>([]);
  recentlyViewed = signal<Product[]>([]);
  trendingProducts = signal<Product[]>([]);

  selectedImage = computed(() => {
    const prod = this.product();
    return prod && prod.images.length > 0
      ? prod.images[0]
      : { id: '', url: '', sortOrder: 0 };
  });

  // Computed: effective price (variant price or base price)
  effectivePrice = computed(() => {
    const variant = this.selectedVariant();
    const prod = this.product();
    if (!prod) return null;

    if (variant?.priceOverride) {
      return variant.priceOverride;
    }
    return { amount: prod.price, currency: 'EGP' };
  });

  // Computed: effective stock (variant quantity or base quantity)
  effectiveStock = computed(() => {
    const variant = this.selectedVariant();
    const prod = this.product();
    if (!prod) return 0;

    if (prod.hasVariants && variant) {
      return variant.quantity;
    }
    return 99;
  });

  // Computed: is in stock (considers variant or base product)
  isInStock = computed(() => {
    const variant = this.selectedVariant();
    const prod = this.product();
    if (!prod) return false;

    if (prod.hasVariants) {
      if (!variant) return true; // No variant selected yet
      return variant.inStock || (variant.allowBackorder ?? false);
    }
    return prod.inStock;
  });

  // Computed: can add to cart
  canAddToCart = computed(() => {
    const prod = this.product();
    if (!prod) return false;

    if (prod.hasVariants) {
      const variant = this.selectedVariant();
      return variant !== null && (variant.inStock || (variant.allowBackorder ?? false));
    }
    return prod.inStock;
  });

  // Computed: require variant selection message
  requiresVariantSelection = computed(() => {
    const prod = this.product();
    return (prod?.hasVariants ?? false) && !this.selectedVariant();
  });

  // Computed: product URL for WhatsApp
  productUrl = computed(() => {
    const prod = this.product();
    if (!prod) return '';
    return window.location.href;
  });

  // Computed: discount percent for gallery / badges
  discountPercent = computed(() => {
    const prod = this.product();
    if (!prod || prod.compareAtPrice == null || prod.compareAtPrice <= prod.price) return null;
    return Math.round(((prod.compareAtPrice - prod.price) / prod.compareAtPrice) * 100);
  });

  // Filled-star booleans for the header rating summary
  ratingStars = computed(() => {
    const avg = Math.round(this.averageRating());
    return [1, 2, 3, 4, 5].map(i => i <= avg);
  });

  setTab(tab: ProductTab) {
    this.activeTab.set(tab);
  }

  isInWishlist(): boolean {
    const prod = this.product();
    return prod ? this.wishlistService.isInWishlist(prod.id, this.selectedVariant()?.id) : false;
  }

  toggleWishlist() {
    const prod = this.product();
    if (prod) this.wishlistService.toggle(prod, this.selectedVariant() ?? undefined);
  }

  scrollToReviews() {
    this.activeTab.set('reviews');
    setTimeout(() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  @HostListener('window:scroll')
  onScroll() {
    this.showStickyBar.set(window.scrollY > 600);
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
        this.loadRatingSummary(product.id);
      },
      error: (error) => {
        console.error('Failed to load product:', error);
        this.loading.set(false);
      }
    });
  }

  private loadRatingSummary(productId: string) {
    this.reviewService.getReviews(productId, { page: 1, pageSize: 1 }).subscribe({
      next: (res) => {
        this.averageRating.set(res.summary.averageRating);
        this.totalReviews.set(res.summary.totalReviews);
        this.totalVerified.set(res.summary.totalVerified);
      },
      error: () => {}
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

  selectImage(image: any) {
    const prod = this.product();
    if (prod) {
      const images = [...prod.images];
      const index = images.findIndex(img => img.id === image.id);
      if (index > 0) {
        // Move selected image to front
        images.splice(index, 1);
        images.unshift(image);
        this.product.set({ ...prod, images });
      }
    }
  }

  increaseQuantity() {
    const maxQty = this.effectiveStock();
    if (this.quantity() < maxQty) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  onVariantSelected(variant: ProductVariant | null) {
    this.selectedVariant.set(variant);
    // Reset quantity when variant changes
    this.quantity.set(1);
  }

  addToCart() {
    const prod = this.product();
    if (!prod) return;

    // If product has variants, require selection
    if ((prod.hasVariants ?? false) && !this.selectedVariant()) {
      return;
    }

    this.addingToCart.set(true);

    // Simulate a brief delay for better UX
    setTimeout(() => {
      const variant = this.selectedVariant();
      this.cartService.addItem(prod, this.quantity(), variant || undefined);
      this.addingToCart.set(false);
      this.showAddedMessage.set(true);

      // Hide message after 3 seconds
      setTimeout(() => {
        this.showAddedMessage.set(false);
      }, 3000);

      // Open cart sidebar
      window.dispatchEvent(new CustomEvent('toggle-cart'));
    }, 300);
  }
}
