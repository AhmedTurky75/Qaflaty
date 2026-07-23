import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { ProductDto } from 'shared';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  private transloco = inject(TranslocoService);

  @Input({ required: true }) product!: ProductDto;
  @Output() delete = new EventEmitter<string>();
  @Output() toggleStatus = new EventEmitter<string>();

  onDelete(event: Event): void {
    event.stopPropagation();
    const msg = this.transloco.translate('products.deleteConfirm', { name: this.product.name });
    if (confirm(msg)) {
      this.delete.emit(this.product.id);
    }
  }

  onToggleStatus(event: Event): void {
    event.stopPropagation();
    this.toggleStatus.emit(this.product.id);
  }

  get statusKey(): string {
    return `products.status.${this.product.status}`;
  }

  getStatusColor(): string {
    switch (this.product.status) {
      case 'Active':
        return 'bg-success/10 text-success';
      case 'Inactive':
        return 'bg-danger/10 text-danger';
      case 'Draft':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-surface-elevated text-text-muted';
    }
  }

  get hasImage(): boolean {
    return !!this.product.firstImageUrl;
  }
}
