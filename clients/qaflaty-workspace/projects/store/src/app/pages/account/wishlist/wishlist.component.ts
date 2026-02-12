import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../../services/customer-auth.service';
import { WishlistService } from '../../../services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900">قائمة الأمنيات</h2>
          <p class="mt-1 text-sm text-gray-600">المنتجات المحفوظة للشراء لاحقاً</p>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">جاري تحميل قائمة الأمنيات...</p>
          </div>
        }

        <!-- Error State -->
        @if (errorMessage()) {
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">حدث خطأ</h3>
            <p class="mt-1 text-sm text-gray-500">{{ errorMessage() }}</p>
            <div class="mt-6">
              <button
                type="button"
                (click)="loadWishlist()"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        }

        <!-- Success Message -->
        @if (successMessage()) {
          <div class="mb-4 rounded-md bg-green-50 p-4">
            <p class="text-sm font-medium text-green-800">{{ successMessage() }}</p>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && !errorMessage() && wishlistItems().length === 0) {
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">قائمة الأمنيات فارغة</h3>
            <p class="mt-1 text-sm text-gray-500">لم تضف أي منتجات إلى قائمة الأمنيات بعد</p>
            <div class="mt-6">
              <a
                routerLink="/"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                تصفح المنتجات
              </a>
            </div>
          </div>
        }

        <!-- Wishlist Items -->
        @if (!isLoading() && wishlistItems().length > 0) {
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="divide-y divide-gray-200">
              @for (item of wishlistItems(); track item.id) {
                <div class="p-6 flex items-start gap-6">
                  <!-- Product Image Placeholder -->
                  <div class="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  <!-- Product Info -->
                  <div class="flex-1 min-w-0">
                    <a
                      [routerLink]="['/products', item.productSlug]"
                      class="text-lg font-medium text-gray-900 hover:text-blue-600"
                    >
                      {{ item.productName }}
                    </a>

                    @if (item.variantAttributes) {
                      <div class="mt-1 text-sm text-gray-500">
                        @for (attr of getVariantAttributesList(item.variantAttributes); track attr.key) {
                          <span>{{ attr.key }}: {{ attr.value }}</span>
                          @if (!$last) { <span> • </span> }
                        }
                      </div>
                    }

                    <p class="mt-2 text-lg font-bold text-gray-900">
                      {{ item.price.toFixed(2) }} ريال
                    </p>

                    @if (item.inStock) {
                      <p class="mt-1 text-sm text-green-600">متوفر في المخزون</p>
                    } @else {
                      <p class="mt-1 text-sm text-red-600">غير متوفر حالياً</p>
                    }

                    <p class="mt-2 text-xs text-gray-500">
                      أضيف في {{ formatDate(item.addedAt) }}
                    </p>
                  </div>

                  <!-- Actions -->
                  <div class="flex-shrink-0 flex flex-col gap-2">
                    <button
                      type="button"
                      (click)="addToCart(item)"
                      [disabled]="!item.inStock || isAddingToCart(item.id)"
                      class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      @if (isAddingToCart(item.id)) {
                        <span>جاري الإضافة...</span>
                      } @else {
                        <svg class="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>أضف للسلة</span>
                      }
                    </button>
                    <button
                      type="button"
                      (click)="removeFromWishlist(item)"
                      [disabled]="isRemovingFromWishlist(item.id)"
                      class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      @if (isRemovingFromWishlist(item.id)) {
                        <span>جاري الحذف...</span>
                      } @else {
                        <svg class="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>حذف</span>
                      }
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Summary -->
          <div class="mt-6 bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between">
              <span class="text-lg font-medium text-gray-900">
                إجمالي المنتجات: {{ wishlistItems().length }}
              </span>
              <button
                type="button"
                (click)="addAllToCart()"
                [disabled]="isAddingAllToCart()"
                class="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {{ isAddingAllToCart() ? 'جاري الإضافة...' : 'أضف الكل للسلة' }}
              </button>
            </div>
          </div>
        }

        <!-- Back Link -->
        <div class="mt-6">
          <a
            routerLink="/account/profile"
            class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <svg class="ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            العودة إلى الملف الشخصي
          </a>
        </div>
      </div>
    </div>
  `
})
export class WishlistComponent implements OnInit {
  private readonly authService = inject(CustomerAuthService);
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);

  readonly wishlistItems = this.wishlistService.wishlistItems;
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly addingToCartIds = signal<Set<string>>(new Set());
  readonly removingFromWishlistIds = signal<Set<string>>(new Set());
  readonly isAddingAllToCart = signal(false);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/account/login']);
      return;
    }

    this.loadWishlist();
  }

  loadWishlist(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.wishlistService.loadWishlist().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'فشل تحميل قائمة الأمنيات. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
      }
    });
  }

  addToCart(item: any): void {
    const ids = this.addingToCartIds();
    ids.add(item.id);
    this.addingToCartIds.set(new Set(ids));
    this.clearMessages();

    // Here you would call cart service to add item
    // For now, just show success message after a delay
    setTimeout(() => {
      const ids = this.addingToCartIds();
      ids.delete(item.id);
      this.addingToCartIds.set(new Set(ids));
      this.successMessage.set('تم إضافة المنتج إلى السلة');
      setTimeout(() => this.clearMessages(), 3000);
    }, 500);
  }

  removeFromWishlist(item: any): void {
    const ids = this.removingFromWishlistIds();
    ids.add(item.id);
    this.removingFromWishlistIds.set(new Set(ids));
    this.clearMessages();

    this.wishlistService.removeFromWishlist(item.productId, item.variantId).subscribe({
      next: () => {
        const ids = this.removingFromWishlistIds();
        ids.delete(item.id);
        this.removingFromWishlistIds.set(new Set(ids));
        this.successMessage.set('تم إزالة المنتج من قائمة الأمنيات');
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        const ids = this.removingFromWishlistIds();
        ids.delete(item.id);
        this.removingFromWishlistIds.set(new Set(ids));
        this.errorMessage.set(error.error?.message || 'فشل إزالة المنتج. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  addAllToCart(): void {
    this.isAddingAllToCart.set(true);
    this.clearMessages();

    // Here you would call cart service to add all items
    // For now, just show success message after a delay
    setTimeout(() => {
      this.isAddingAllToCart.set(false);
      this.successMessage.set('تم إضافة جميع المنتجات إلى السلة');
      setTimeout(() => this.clearMessages(), 3000);
    }, 1000);
  }

  isAddingToCart(itemId: string): boolean {
    return this.addingToCartIds().has(itemId);
  }

  isRemovingFromWishlist(itemId: string): boolean {
    return this.removingFromWishlistIds().has(itemId);
  }

  getVariantAttributesList(attributes: { [key: string]: string }): Array<{ key: string; value: string }> {
    return Object.entries(attributes).map(([key, value]) => ({ key, value }));
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
