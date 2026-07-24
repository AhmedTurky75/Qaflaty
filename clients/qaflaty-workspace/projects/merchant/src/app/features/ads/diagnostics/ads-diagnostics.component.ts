import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, DiagnosticFindingDto } from '../services/ads.service';

@Component({
  selector: 'app-ads-diagnostics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ads-diagnostics.component.html',
  styleUrl: './ads-diagnostics.component.scss'
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
      case 'High': return 'border-danger/30 bg-danger/10';
      case 'Medium': return 'border-warning/30 bg-warning/10';
      case 'Low': return 'border-primary/30 bg-primary-tint';
      default: return 'border-success/30 bg-success/10';
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
