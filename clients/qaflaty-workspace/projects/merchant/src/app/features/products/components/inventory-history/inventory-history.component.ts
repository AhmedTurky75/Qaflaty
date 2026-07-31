import { Component, Input, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProductService } from '../../services/product.service';
import { StoreContextService } from '../../../../core/services/store-context.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { InventoryMovementDto } from 'shared';

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [DatePipe, TranslocoPipe, IconComponent],
  templateUrl: './inventory-history.component.html',
  styleUrl: './inventory-history.component.scss',
})
export class InventoryHistoryComponent implements OnChanges {
  @Input() productId!: string;

  private productService = inject(ProductService);
  private storeContext = inject(StoreContextService);

  loading = signal(false);
  movements = signal<InventoryMovementDto[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && this.productId) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.productId) return;

    this.loading.set(true);
    this.productService.getInventoryHistory(storeId, this.productId).subscribe({
      next: (movements) => {
        this.movements.set(movements.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load inventory history:', err);
        this.loading.set(false);
      }
    });
  }

  getMovementTypeClass(type: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (type) {
      case 'Restock':
        return `${base} bg-success/10 text-success`;
      case 'Sale':
        return `${base} bg-primary-tint text-primary`;
      case 'Return':
        return `${base} bg-warning/10 text-warning`;
      case 'Damaged':
        return `${base} bg-danger/10 text-danger`;
      case 'Adjustment':
      default:
        return `${base} bg-surface-elevated text-text-muted`;
    }
  }
}
