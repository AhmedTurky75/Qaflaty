import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { StoreConfigurationDto, UpdateStoreConfigurationRequest } from 'shared';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './general-settings.component.html',
  styleUrl: './general-settings.component.scss'
})
export class GeneralSettingsComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);

  localConfig: StoreConfigurationDto | null = null;

  pageToggles: { key: keyof StoreConfigurationDto['pageToggles']; label: string }[] = [
    { key: 'aboutPage', label: 'About Page' },
    { key: 'contactPage', label: 'Contact Page' },
    { key: 'faqPage', label: 'FAQ Page' },
    { key: 'termsPage', label: 'Terms Page' },
    { key: 'privacyPage', label: 'Privacy Page' },
    { key: 'shippingReturnsPage', label: 'Shipping & Returns Page' },
    { key: 'cartPage', label: 'Cart Page' },
  ];

  featureToggles: { key: keyof StoreConfigurationDto['featureToggles']; label: string }[] = [
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'reviews', label: 'Product Reviews' },
    { key: 'promoCodes', label: 'Promo Codes' },
    { key: 'newsletter', label: 'Newsletter' },
    { key: 'productSearch', label: 'Product Search' },
    { key: 'socialLinks', label: 'Social Links' },
    { key: 'analytics', label: 'Analytics' },
  ];

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
        if (this.localConfig!.customerAuthSettings.requireOtpOnPlaceOrder === undefined) {
          this.localConfig!.customerAuthSettings.requireOtpOnPlaceOrder = false;
        }
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
        this.saveErr.set(err.message || 'Failed to save settings');
      }
    });
  }
}
