import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, AdsDashboardDto } from '../services/ads.service';

@Component({
  selector: 'app-ads-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ads-dashboard.component.html',
  styleUrl: './ads-dashboard.component.scss'
})
export class AdsDashboardComponent {
  private adsService = inject(AdsService);
  private storeContext = inject(StoreContextService);

  dashboard = signal<AdsDashboardDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const storeId = this.storeContext.currentStoreId();
      if (storeId) this.load(storeId);
    });
  }

  load(storeId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.adsService.getDashboard(storeId).subscribe({
      next: (dto) => {
        this.dashboard.set(dto);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load the Ads dashboard.');
        this.loading.set(false);
      }
    });
  }

  healthColor(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Verified': return 'bg-success/10 text-success';
      case 'Connected': return 'bg-primary-tint text-primary';
      case 'Error': return 'bg-danger/10 text-danger';
      case 'Disconnected': return 'bg-surface-elevated text-text-muted';
      default: return 'bg-surface-elevated text-text-muted';
    }
  }
}
