import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../services/store.service';
import { CartService } from '../../services/cart.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private storeService = inject(StoreService);
  private cartService = inject(CartService);
  private categoryService = inject(CategoryService);

  store = this.storeService.currentStore;
  itemCount = this.cartService.itemCount;
  categories = signal<Category[]>([]);
  searchQuery = signal<string>('');
  showMobileMenu = signal<boolean>(false);
  showCartSidebar = signal<boolean>(false);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Failed to load categories:', error)
    });
  }

  onSearch() {
    const query = this.searchQuery();
    if (query.trim()) {
      // Navigate to products page with search query
      window.location.href = `/products?search=${encodeURIComponent(query)}`;
    }
  }

  toggleCart() {
    this.showCartSidebar.update(v => !v);
    // Emit event or use a service to show cart sidebar
    window.dispatchEvent(new CustomEvent('toggle-cart'));
  }

  toggleMobileMenu() {
    this.showMobileMenu.update(v => !v);
  }
}
