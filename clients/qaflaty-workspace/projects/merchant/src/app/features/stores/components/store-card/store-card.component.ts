import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { StoreDto, StoreStatus } from 'shared';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-store-card',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './store-card.component.html',
  styleUrls: ['./store-card.component.scss']
})
export class StoreCardComponent {
  private transloco = inject(TranslocoService);

  @Input() store!: StoreDto;
  @Output() delete = new EventEmitter<string>();

  StoreStatus = StoreStatus;

  getStatusColor(status: StoreStatus): string {
    switch (status) {
      case StoreStatus.Active:
        return 'bg-success/10 text-success';
      case StoreStatus.Inactive:
        return 'bg-surface-elevated text-text-muted';
      case StoreStatus.Suspended:
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-surface-elevated text-text-muted';
    }
  }

  onDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (confirm(this.transloco.translate('stores.deleteConfirm', { name: this.store.name }))) {
      this.delete.emit(this.store.id);
    }
  }

  getStoreUrl(): string {
    return this.store.customDomain || `${this.store.slug}.qaflaty.com`;
  }
}
