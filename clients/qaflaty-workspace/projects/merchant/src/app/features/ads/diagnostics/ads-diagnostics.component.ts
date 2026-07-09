import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, DiagnosticFindingDto } from '../services/ads.service';

@Component({
  selector: 'app-ads-diagnostics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ads-diagnostics.component.html'
})
export class AdsDiagnosticsComponent {
  private adsService = inject(AdsService);
  private storeContext = inject(StoreContextService);

  findings = signal<DiagnosticFindingDto[]>([]);
  loading = signal(false);
  private storeId = '';

  constructor() {
    effect(() => {
      const id = this.storeContext.currentStoreId();
      if (id) {
        this.storeId = id;
        this.load();
      }
    });
  }

  load(): void {
    this.loading.set(true);
    this.adsService.getDiagnostics(this.storeId).subscribe({
      next: (findings) => {
        this.findings.set(findings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  severityClass(severity: string): string {
    switch (severity) {
      case 'High': return 'border-red-200 bg-red-50';
      case 'Medium': return 'border-yellow-200 bg-yellow-50';
      case 'Low': return 'border-blue-200 bg-blue-50';
      default: return 'border-green-200 bg-green-50';
    }
  }

  severityIcon(severity: string): string {
    switch (severity) {
      case 'High': return '✗';
      case 'Medium': return '⚠';
      case 'Low': return 'ℹ';
      default: return '✓';
    }
  }
}
