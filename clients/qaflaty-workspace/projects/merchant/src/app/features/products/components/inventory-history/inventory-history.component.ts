import { Component, Input, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { StoreContextService } from '../../../../core/services/store-context.service';
import { InventoryMovementDto } from 'shared';

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Inventory History</h3>
        <button
          type="button"
          (click)="loadHistory()"
          [disabled]="loading()"
          class="text-sm text-primary hover:text-primary-dark"
        >
          @if (loading()) {
            Loading...
          } @else {
            Refresh
          }
        </button>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-8">
          <svg class="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else if (movements().length === 0) {
        <div class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          <p>No inventory movements recorded yet.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                <th class="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                <th class="px-4 py-3 text-left font-medium text-gray-700">Quantity</th>
                <th class="px-4 py-3 text-left font-medium text-gray-700">Reason</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (movement of movements(); track movement.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-gray-600">
                    {{ movement.createdAt | date:'medium' }}
                  </td>
                  <td class="px-4 py-3">
                    <span [class]="getMovementTypeClass(movement.movementType)">
                      {{ movement.movementType }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span [class.text-green-600]="movement.quantity > 0" [class.text-red-600]="movement.quantity < 0">
                      {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-600">
                    {{ movement.reason || '-' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
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
        // Sort by date descending
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
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (type) {
      case 'Restock':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Sale':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Return':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Damaged':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Adjustment':
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }
}
