import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentMerchant$ = this.authService.currentMerchant$;
  sidebarOpen = signal(false);
  userMenuOpen = signal(false);

  navigationItems = [
    { name: 'Dashboard', icon: 'home', route: '/dashboard' },
    { name: 'Stores', icon: 'store', route: '/stores' },
    { name: 'Products', icon: 'box', route: '/products' },
    { name: 'Orders', icon: 'shopping-bag', route: '/orders' },
    { name: 'Customers', icon: 'users', route: '/customers' },
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
