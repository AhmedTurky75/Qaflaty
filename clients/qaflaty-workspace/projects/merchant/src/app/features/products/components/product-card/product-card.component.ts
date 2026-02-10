import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductDto } from 'shared';

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
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  get hasImage(): boolean {
    return !!this.product.firstImageUrl;
  }
}
