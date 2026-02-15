import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutRendererComponent } from './components/layout/layout-renderer.component';
import { CartSidebarComponent } from './components/shared/cart-sidebar.component';
import { WhatsAppButtonComponent } from './components/shared/whatsapp-button.component';
import { StoreService } from './services/store.service';
import { ConfigService } from './services/config.service';
import { ThemeService } from './services/theme.service';
import { CartService } from './services/cart.service';
import { I18nService } from './services/i18n.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    LayoutRendererComponent,
    CartSidebarComponent,
    WhatsAppButtonComponent
  ],
  template: `
    @if (storeService.currentStore() && configService.isLoaded()) {
      <app-layout-renderer>
        <router-outlet />
      </app-layout-renderer>
      <app-cart-sidebar />
      <app-whatsapp-button variant="floating" position="bottom-right" />
    } @else if (storeService.isLoading()) {
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center">
          <svg class="animate-spin h-16 w-16 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-xl text-gray-600">Loading store...</p>
        </div>
      </div>
    } @else {
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center max-w-md mx-auto p-8">
          <svg class="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <h1 class="text-3xl font-bold text-gray-900 mb-4">Store Not Found</h1>
          <p class="text-gray-600 mb-8">
            The store you're looking for doesn't exist or is currently unavailable.
          </p>
          <a href="https://qaflaty.com"
            class="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            Visit Qaflaty
          </a>
        </div>
      </div>
    }
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  storeService = inject(StoreService);
  configService = inject(ConfigService);
  private themeService = inject(ThemeService);
  private cartService = inject(CartService);
  private i18nService = inject(I18nService);

  ngOnInit() {
    this.storeService.detectAndLoadStore().pipe(
      switchMap(store => {
        if (store.deliverySettings) {
          this.cartService.setDeliverySettings(
            store.deliverySettings.deliveryFee,
            store.deliverySettings.freeDeliveryThreshold
          );
        }
        return this.configService.loadConfig();
      })
    ).subscribe({
      error: (error) => {
        console.error('Failed to load store:', error);
        this.storeService.error.set('Store not found');
      }
    });
  }
}
