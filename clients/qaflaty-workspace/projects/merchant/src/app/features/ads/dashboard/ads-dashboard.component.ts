import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, AdsDashboardDto } from '../services/ads.service';

@Component({
  selector: 'app-ads-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ads-dashboard.component.html'
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
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-800';
      case 'Connected': return 'bg-blue-100 text-blue-800';
      case 'Error': return 'bg-red-100 text-red-800';
      case 'Disconnected': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
}
