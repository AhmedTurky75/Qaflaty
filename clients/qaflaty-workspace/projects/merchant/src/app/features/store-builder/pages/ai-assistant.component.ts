import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import {
  StoreConfigurationDto,
  UpdateStoreConfigurationRequest,
  AiAssistantStatusDto,
  AiKnowledgeRefreshResultDto,
  AiAnalyticsDto,
} from 'shared';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss'
})
export class AiAssistantComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  refreshing = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);
  refreshErr = signal<string | null>(null);
  status = signal<AiAssistantStatusDto | null>(null);
  refreshResult = signal<AiKnowledgeRefreshResultDto | null>(null);
  analytics = signal<AiAnalyticsDto | null>(null);

  localConfig: StoreConfigurationDto | null = null;

  ngOnInit(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loadErr.set('No store selected');
      this.loading.set(false);
      return;
    }

    this.builderService.getConfiguration(storeId).subscribe({
      next: (config) => {
        this.localConfig = JSON.parse(JSON.stringify(config));
        this.loading.set(false);
      },
      error: (err) => {
        this.loadErr.set(err.message || 'Failed to load configuration');
        this.loading.set(false);
      }
    });

    this.loadStatus(storeId);
    this.loadAnalytics(storeId);
  }

  private loadStatus(storeId: string): void {
    this.builderService.getAiAssistantStatus(storeId).subscribe({
      next: (status) => this.status.set(status),
      error: () => { /* status is best-effort */ }
    });
  }

  private loadAnalytics(storeId: string): void {
    this.builderService.getAiAnalytics(storeId).subscribe({
      next: (analytics) => this.analytics.set(analytics),
      error: () => { /* analytics is best-effort */ }
    });
  }

  refreshKnowledge(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.refreshing.set(true);
    this.refreshErr.set(null);
    this.refreshResult.set(null);

    this.builderService.refreshAiKnowledge(storeId).subscribe({
      next: (result) => {
        this.refreshResult.set(result);
        this.refreshing.set(false);
        this.loadStatus(storeId);
      },
      error: (err) => {
        this.refreshing.set(false);
        this.refreshErr.set(err.error?.message || err.message || 'Failed to refresh AI knowledge');
      }
    });
  }

  save(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.localConfig) return;

    this.saving.set(true);
    this.saved.set(false);
    this.saveErr.set(null);

    const req: UpdateStoreConfigurationRequest = {
      pageToggles: this.localConfig.pageToggles,
      featureToggles: this.localConfig.featureToggles,
      customerAuthSettings: this.localConfig.customerAuthSettings,
      communicationSettings: this.localConfig.communicationSettings,
      aiAssistantSettings: this.localConfig.aiAssistantSettings,
      localizationSettings: this.localConfig.localizationSettings,
      socialLinks: this.localConfig.socialLinks,
      headerVariant: this.localConfig.headerVariant,
      footerVariant: this.localConfig.footerVariant,
      productCardVariant: this.localConfig.productCardVariant,
      productGridVariant: this.localConfig.productGridVariant,
    };

    this.builderService.updateConfiguration(storeId, req).subscribe({
      next: (config) => {
        this.localConfig = JSON.parse(JSON.stringify(config));
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveErr.set(err.error?.message || err.message || 'Failed to save AI assistant settings');
      }
    });
  }
}
