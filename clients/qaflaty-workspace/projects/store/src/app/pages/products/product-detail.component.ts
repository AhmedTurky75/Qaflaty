import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product, ProductVariant } from '../../models/product.model';
import { VariantSelectorComponent } from '../../components/products/variant-selector.component';
import { WhatsAppButtonComponent } from '../../components/shared/whatsapp-button.component';
import { WhatsAppService } from '../../services/whatsapp.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, VariantSelectorComponent, WhatsAppButtonComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  whatsAppService = inject(WhatsAppService);

  product = signal<Product | null>(null);
  loading = signal<boolean>(true);
  quantity = signal<number>(1);
  addingToCart = signal<boolean>(false);
  showAddedMessage = signal<boolean>(false);
  selectedVariant = signal<ProductVariant | null>(null);

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
      },
      error: (error) => {
        console.error('Failed to load product:', error);
        this.loading.set(false);
      }
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
