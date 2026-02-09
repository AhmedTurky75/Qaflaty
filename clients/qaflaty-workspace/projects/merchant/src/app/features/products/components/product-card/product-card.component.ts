import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductDto, ProductStatus } from 'shared';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductDto;
  @Output() delete = new EventEmitter<string>();
  @Output() toggleStatus = new EventEmitter<string>();

  ProductStatus = ProductStatus;

  onDelete(event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${this.product.name}"?`)) {
      this.delete.emit(this.product.id);
    }
  }

  onToggleStatus(event: Event): void {
    event.stopPropagation();
    this.toggleStatus.emit(this.product.id);
  }

  getStatusColor(): string {
    switch (this.product.status) {
      case ProductStatus.Active:
        return 'bg-green-100 text-green-800';
      case ProductStatus.Inactive:
        return 'bg-red-100 text-red-800';
      case ProductStatus.Draft:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStockStatusColor(): string {
    if (!this.product.inventory.inStock) {
      return 'text-red-600';
    }
    if (this.product.inventory.lowStock) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  }

  getStockStatusText(): string {
    if (!this.product.inventory.inStock) {
      return 'Out of Stock';
    }
    if (this.product.inventory.lowStock) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  getImageUrl(): string {
    return this.product.images[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image';
  }
}
