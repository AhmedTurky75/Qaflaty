import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, ProviderMonitoringDto } from '../services/ads.service';

@Component({
  selector: 'app-ads-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ads-monitoring.component.html'
})
export class AdsMonitoringComponent {
  private adsService = inject(AdsService);
  private storeContext = inject(StoreContextService);

  providers = signal<ProviderMonitoringDto[]>([]);
  loading = signal(false);

  constructor() {
    effect(() => {
      const storeId = this.storeContext.currentStoreId();
      if (storeId) this.load(storeId);
    });
  }

  load(storeId: string): void {
    this.loading.set(true);
    this.adsService.getMonitoring(storeId).subscribe({
      next: (dto) => {
        this.providers.set(dto.providers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  rateColor(rate: number): string {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  }
}
