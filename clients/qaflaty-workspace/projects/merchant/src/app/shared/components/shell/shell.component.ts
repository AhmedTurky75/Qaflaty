import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
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

  currentMerchant$ = this.authService.currentMerchant$;
  sidebarOpen = signal(false);
  userMenuOpen = signal(false);

  ngOnInit(): void {
    this.storeContext.initialize();
  }

  navigationItems = [
    { name: 'Dashboard', icon: 'home', route: '/dashboard' },
    { name: 'Stores', icon: 'store', route: '/stores' },
    { name: 'Products', icon: 'box', route: '/products' },
    { name: 'Orders', icon: 'shopping-bag', route: '/orders' },
    { name: 'Customers', icon: 'users', route: '/customers' },
    { name: 'Store Builder', icon: 'layout', route: '/store-builder' },
    { name: 'Settings', icon: 'settings', route: '/settings' }
  ];

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
