import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreDto, StoreStatus } from 'shared';

@Component({
  selector: 'app-store-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './store-card.component.html',
  styleUrls: ['./store-card.component.scss']
})
export class StoreCardComponent {
  @Input() store!: StoreDto;
  @Output() delete = new EventEmitter<string>();

  StoreStatus = StoreStatus;

  getStatusColor(status: StoreStatus): string {
    switch (status) {
      case StoreStatus.Active:
        return 'bg-green-100 text-green-800';
      case StoreStatus.Inactive:
        return 'bg-gray-100 text-gray-800';
      case StoreStatus.Suspended:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${this.store.name}"?`)) {
      this.delete.emit(this.store.id);
    }
  }

  getStoreUrl(): string {
    return this.store.customDomain || `${this.store.slug}.qaflaty.com`;
  }
}
