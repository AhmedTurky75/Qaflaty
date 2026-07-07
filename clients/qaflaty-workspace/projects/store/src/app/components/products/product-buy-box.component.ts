import { Component, inject, input, output, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { Product, ProductVariant } from '../../models/product.model';
import { VariantSelectorComponent } from './variant-selector.component';
import { WhatsAppButtonComponent } from '../shared/whatsapp-button.component';
import { WhatsAppService } from '../../services/whatsapp.service';
import { ProductGalleryComponent } from './product-gallery.component';
import { ReviewService } from '../../services/review.service';
import { WishlistService } from '../../services/wishlist.service';
import { I18nService } from '../../services/i18n.service';
import { ConfigService } from '../../services/config.service';
import { StorePricePipe } from '../../pipes/store-price.pipe';

/**
 * Self-contained purchase decision zone (gallery, price, variants, add-to-cart,
 * wishlist, trust badges, WhatsApp inquiry, sticky buy bar). Shared by the
 * classic product-detail page and the product-landing page so both stay in sync.
 */
@Component({
  selector: 'app-product-buy-box',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, VariantSelectorComponent, WhatsAppButtonComponent, ProductGalleryComponent, StorePricePipe],
  templateUrl: './product-buy-box.component.html',
  styleUrls: ['./product-buy-box.component.css']
})
export class ProductBuyBoxComponent {
  private cartService = inject(CartService);
  private config = inject(ConfigService);
  private reviewService = inject(ReviewService);
  private wishlistService = inject(WishlistService);
  private i18n = inject(I18nService);
  whatsAppService = inject(WhatsAppService);

  product = input.required<Product>();
  reviewsClick = output<void>();

  displayName = computed(() => this.i18n.nameFor(this.product().name, this.product().nameAr));

  // Rating summary (loaded whenever the product changes)
  averageRating = signal<number>(0);
  totalReviews = signal<number>(0);
  totalVerified = signal<number>(0);

  // UI state
  showStickyBar = signal<boolean>(false);
  quantity = signal<number>(1);
  addingToCart = signal<boolean>(false);
  showAddedMessage = signal<boolean>(false);
  selectedVariant = signal<ProductVariant | null>(null);

  effectivePrice = computed(() => {
    const variant = this.selectedVariant();
    const prod = this.product();
    if (variant?.priceOverride) {
      return variant.priceOverride;
    }
    return { amount: prod.price, currency: this.currency() };
  });

  /** The store's single currency code, read from storefront config. */
  currency = computed(() => this.config.config()?.currency ?? 'EGP');

  effectiveStock = computed(() => {
    const variant = this.selectedVariant();
    const prod = this.product();
    if (prod.hasVariants && variant) {
      return variant.quantity;
    }
    return 99;
  });

  isInStock = computed(() => {
    const variant = this.selectedVariant();
    const prod = this.product();
    if (prod.hasVariants) {
      if (!variant) return true; // No variant selected yet
      return variant.inStock || (variant.allowBackorder ?? false);
    }
    return prod.inStock;
  });

  canAddToCart = computed(() => {
    const prod = this.product();
    if (prod.hasVariants) {
      const variant = this.selectedVariant();
      return variant !== null && (variant.inStock || (variant.allowBackorder ?? false));
    }
    return prod.inStock;
  });

  requiresVariantSelection = computed(() => {
    const prod = this.product();
    return (prod.hasVariants ?? false) && !this.selectedVariant();
  });

  productUrl = computed(() => {
    this.product();
    return typeof window !== 'undefined' ? window.location.href : '';
  });

  discountPercent = computed(() => {
    const prod = this.product();
    if (prod.compareAtPrice == null || prod.compareAtPrice <= prod.price) return null;
    return Math.round(((prod.compareAtPrice - prod.price) / prod.compareAtPrice) * 100);
  });

  ratingStars = computed(() => {
    const avg = Math.round(this.averageRating());
    return [1, 2, 3, 4, 5].map(i => i <= avg);
  });

  constructor() {
    effect(() => {
      const prod = this.product();
      this.selectedVariant.set(null);
      this.quantity.set(1);
      this.loadRatingSummary(prod.id);
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

  isInWishlist(): boolean {
    return this.wishlistService.isInWishlist(this.product().id, this.selectedVariant()?.id);
  }

  toggleWishlist() {
    this.wishlistService.toggle(this.product(), this.selectedVariant() ?? undefined);
  }

  onReviewsClick() {
    this.reviewsClick.emit();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.showStickyBar.set(window.scrollY > 600);
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
    this.quantity.set(1);
  }

  addToCart() {
    const prod = this.product();
    if ((prod.hasVariants ?? false) && !this.selectedVariant()) {
      return;
    }

    this.addingToCart.set(true);

    setTimeout(() => {
      const variant = this.selectedVariant();
      this.cartService.addItem(prod, this.quantity(), variant || undefined);
      this.addingToCart.set(false);
      this.showAddedMessage.set(true);

      setTimeout(() => {
        this.showAddedMessage.set(false);
      }, 3000);

      window.dispatchEvent(new CustomEvent('toggle-cart'));
    }, 300);
  }
}
