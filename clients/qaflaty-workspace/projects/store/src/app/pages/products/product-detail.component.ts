import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);

  product = signal<Product | null>(null);
  loading = signal<boolean>(true);
  quantity = signal<number>(1);
  addingToCart = signal<boolean>(false);
  showAddedMessage = signal<boolean>(false);

  selectedImage = computed(() => {
    const prod = this.product();
    return prod && prod.images.length > 0
      ? prod.images[0]
      : { id: '', url: '', sortOrder: 0 };
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
    const prod = this.product();
    if (prod && this.quantity() < prod.inventory.quantity) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart() {
    const prod = this.product();
    if (!prod) return;

    this.addingToCart.set(true);

    // Simulate a brief delay for better UX
    setTimeout(() => {
      this.cartService.addItem(prod, this.quantity());
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
