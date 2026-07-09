import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { MerchantChatService } from '../../../features/chat/services/merchant-chat.service';
import { StoreSwitcherComponent } from '../store-switcher/store-switcher.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, StoreSwitcherComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private storeContext = inject(StoreContextService);
  private chatService = inject(MerchantChatService);

  currentMerchant = this.authService.currentMerchant;
  sidebarOpen = signal(false);
  userMenuOpen = signal(false);

  // Chat unread count
  public chatUnreadCount = this.chatService.totalUnreadCount;

  constructor() {
    // Poll for unread count every 30 seconds when a store is selected
    effect((onCleanup) => {
      const currentStore = this.storeContext.currentStore();
      if (currentStore) {
        this.loadUnreadCount();
        const interval = setInterval(() => this.loadUnreadCount(), 30000);
        onCleanup(() => clearInterval(interval));
      }
    });
  }

  ngOnInit(): void {
    this.storeContext.initialize();
  }

  private async loadUnreadCount() {
    const currentStore = this.storeContext.currentStore();
    if (currentStore) {
      try {
        await this.chatService.loadConversations(currentStore.id);
      } catch (err) {
        // Silently fail
      }
    }
  }

  navigationItems = computed(() => {
    // This app uses a store-less token (no select-store / role claim). The merchant's
    // authority comes from owning the currently-selected store, so gate the Team
    // section on ownership of the active store rather than a (never-set) role signal.
    const merchant = this.authService.currentMerchant();
    const currentStore = this.storeContext.currentStore();
    const isStoreOwner = !!merchant && !!currentStore && currentStore.merchantId === merchant.id;
    const items = [
      { name: 'Dashboard', icon: 'home', route: '/dashboard' },
      { name: 'Stores', icon: 'store', route: '/stores' },
      { name: 'Products', icon: 'box', route: '/products' },
      { name: 'Orders', icon: 'shopping-bag', route: '/orders' },
      { name: 'Returns', icon: 'refresh', route: '/returns' },
      { name: 'Active Carts', icon: 'cart', route: '/active-carts' },
      { name: 'Customers', icon: 'users', route: '/customers' },
      { name: 'Reviews', icon: 'star', route: '/reviews' },
      { name: 'Promo Codes', icon: 'tag', route: '/promo-codes' },
      { name: 'Live Chat', icon: 'message-square', route: '/chat' },
      { name: 'Store Builder', icon: 'layout', route: '/store-builder' },
      { name: 'Ads Management', icon: 'megaphone', route: '/ads' },
      { name: 'Settings', icon: 'settings', route: '/settings' }
    ];
    if (isStoreOwner) {
      items.splice(2, 0, { name: 'Team', icon: 'team', route: '/stores/team' });
    }
    return items;
  });

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
