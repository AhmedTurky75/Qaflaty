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
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <a [routerLink]="'/store-builder'" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </a>
          <h1 class="text-lg font-semibold text-gray-900">General Settings</h1>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading()) {
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500">Loading configuration...</p>
          </div>
        }

        @if (loadErr()) {
          <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700">{{ loadErr() }}</p>
          </div>
        }

        @if (!loading() && localConfig) {
          <div class="space-y-6">

            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 class="text-base font-semibold text-gray-900 mb-4">Page Toggles</h2>
              <div class="space-y-3">
                @for (toggle of pageToggles; track toggle.key) {
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">{{ toggle.label }}</label>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.pageToggles[toggle.key]" />
                      <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                      <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                    </label>
                  </div>
                }
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 class="text-base font-semibold text-gray-900 mb-4">Feature Toggles</h2>
              <div class="space-y-3">
                @for (toggle of featureToggles; track toggle.key) {
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">{{ toggle.label }}</label>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.featureToggles[toggle.key]" />
                      <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                      <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                    </label>
                  </div>
                }
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 class="text-base font-semibold text-gray-900 mb-4">Customer Accounts</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Authentication Mode</label>
                  <select
                    [(ngModel)]="localConfig!.customerAuthSettings.mode"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="GuestOnly">Guest Only</option>
                    <option value="Required">Required</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Allow Guest Checkout</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.customerAuthSettings.allowGuestCheckout" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Require Email Verification</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.customerAuthSettings.requireEmailVerification" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-700">Require OTP on Place Order</p>
                    <p class="text-xs text-gray-500 mt-0.5">Customer must verify email OTP before order is confirmed</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.customerAuthSettings.requireOtpOnPlaceOrder" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 class="text-base font-semibold text-gray-900 mb-4">Language</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
                  <select
                    [(ngModel)]="localConfig!.localizationSettings.defaultLanguage"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Enable Bilingual</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.localizationSettings.enableBilingual" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Default Direction</label>
                  <select
                    [(ngModel)]="localConfig!.localizationSettings.defaultDirection"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="ltr">Left to Right (LTR)</option>
                    <option value="rtl">Right to Left (RTL)</option>
                  </select>
                </div>
              </div>
            </div>

            @if (saved()) {
              <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p class="text-green-700 text-sm font-medium">Settings saved successfully.</p>
              </div>
            }
            @if (saveErr()) {
              <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p class="text-red-700 text-sm">{{ saveErr() }}</p>
              </div>
            }

            <div class="flex justify-end">
              <button
                (click)="save()"
                [disabled]="saving()"
                class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
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
