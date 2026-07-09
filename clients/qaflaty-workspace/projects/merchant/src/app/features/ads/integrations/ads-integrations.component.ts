import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { AdsService, ProviderIntegrationDto, AdProvider } from '../services/ads.service';

interface ProviderMeta {
  id: AdProvider;
  name: string;
  available: boolean;
  fields: { key: string; label: string; secret?: boolean; optional?: boolean }[];
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'Meta', name: 'Meta Pixel & Conversions API', available: true,
    fields: [
      { key: 'pixelId', label: 'Pixel ID' },
      { key: 'accessToken', label: 'Access Token', secret: true },
      { key: 'testEventCode', label: 'Test Event Code', optional: true }
    ]
  },
  { id: 'TikTok', name: 'TikTok Pixel & Events API', available: false, fields: [{ key: 'pixelId', label: 'Pixel Code' }, { key: 'accessToken', label: 'Access Token', secret: true }] },
  { id: 'Snapchat', name: 'Snapchat Pixel', available: false, fields: [{ key: 'pixelId', label: 'Pixel ID' }, { key: 'accessToken', label: 'API Token', secret: true }] },
  { id: 'GoogleAnalytics4', name: 'Google Analytics 4', available: false, fields: [{ key: 'pixelId', label: 'Measurement ID' }, { key: 'accessToken', label: 'API Secret', secret: true }] },
  { id: 'GoogleAds', name: 'Google Ads Conversion Tracking', available: false, fields: [{ key: 'pixelId', label: 'Conversion ID' }, { key: 'accessToken', label: 'API Token', secret: true }] },
  { id: 'GoogleTagManager', name: 'Google Tag Manager', available: false, fields: [{ key: 'pixelId', label: 'Container ID' }] }
];

@Component({
  selector: 'app-ads-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ads-integrations.component.html'
})
export class AdsIntegrationsComponent {
  private adsService = inject(AdsService);
  private storeContext = inject(StoreContextService);

  providers = PROVIDERS;
  connected = signal<Record<string, ProviderIntegrationDto>>({});
  loading = signal(false);
  expanded = signal<string | null>(null);
  formValues = signal<Record<string, string>>({});
  browserEnabled = signal(true);
  serverEnabled = signal(true);
  saving = signal(false);
  message = signal<{ text: string; ok: boolean } | null>(null);

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
    this.adsService.getProviders(this.storeId).subscribe({
      next: (list) => {
        const map: Record<string, ProviderIntegrationDto> = {};
        for (const p of list) map[p.provider] = p;
        this.connected.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isConnected(providerId: string): ProviderIntegrationDto | null {
    return this.connected()[providerId] ?? null;
  }

  toggleExpand(providerId: string): void {
    this.message.set(null);
    if (this.expanded() === providerId) {
      this.expanded.set(null);
      return;
    }
    this.expanded.set(providerId);
    const existing = this.isConnected(providerId);
    this.formValues.set(existing ? { ...existing.maskedCredentials } : {});
    this.browserEnabled.set(existing?.browserTrackingEnabled ?? true);
    this.serverEnabled.set(existing?.serverTrackingEnabled ?? true);
  }

  updateField(key: string, value: string): void {
    this.formValues.update(v => ({ ...v, [key]: value }));
  }

  save(provider: ProviderMeta): void {
    this.saving.set(true);
    this.message.set(null);
    this.adsService.connectProvider(this.storeId, provider.id, {
      credentials: this.formValues(),
      browserTrackingEnabled: this.browserEnabled(),
      serverTrackingEnabled: this.serverEnabled()
    }).subscribe({
      next: (dto) => {
        this.connected.update(c => ({ ...c, [provider.id]: dto }));
        this.saving.set(false);
        this.message.set({ text: 'Saved. Click Verify Connection to confirm it works.', ok: true });
      },
      error: (err) => {
        this.saving.set(false);
        this.message.set({ text: err.error?.message || 'Failed to save credentials.', ok: false });
      }
    });
  }

  verify(providerId: string): void {
    this.saving.set(true);
    this.message.set(null);
    this.adsService.verifyProvider(this.storeId, providerId).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set({ text: 'Verified successfully!', ok: true });
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.message.set({ text: err.error?.message || 'Verification failed.', ok: false });
        this.load();
      }
    });
  }

  disconnect(providerId: string): void {
    this.saving.set(true);
    this.adsService.disconnectProvider(this.storeId, providerId).subscribe({
      next: () => {
        this.saving.set(false);
        this.expanded.set(null);
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }
}
