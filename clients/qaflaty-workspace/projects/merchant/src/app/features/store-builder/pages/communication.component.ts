import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { StoreConfigurationDto, UpdateStoreConfigurationRequest } from 'shared';

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './communication.component.html',
  styleUrl: './communication.component.scss'
})
export class CommunicationComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);

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
        this.saveErr.set(err.message || 'Failed to save communication settings');
      }
    });
  }
}
