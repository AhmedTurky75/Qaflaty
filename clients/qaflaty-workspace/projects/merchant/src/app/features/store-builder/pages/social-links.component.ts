import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { StoreConfigurationDto, UpdateStoreConfigurationRequest } from 'shared';

interface SocialField {
  key: keyof StoreConfigurationDto['socialLinks'];
  label: string;
  placeholder: string;
}

@Component({
  selector: 'app-social-links',
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
          <h1 class="text-lg font-semibold text-gray-900">Social Links</h1>
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
              <div class="flex items-center justify-between mb-5">
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Social Links Feature</h2>
                  <p class="text-sm text-gray-500 mt-0.5">Show social links in your store header/footer</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.featureToggles.socialLinks" />
                  <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                  <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                </label>
              </div>

              <div class="space-y-4">
                @for (field of socialFields; track field.key) {
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
                    <input
                      type="url"
                      [(ngModel)]="localConfig!.socialLinks[field.key]"
                      [placeholder]="field.placeholder"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                  </div>
                }
              </div>
            </div>

            @if (saved()) {
              <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p class="text-green-700 text-sm font-medium">Social links saved successfully.</p>
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
export class SocialLinksComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);

  localConfig: StoreConfigurationDto | null = null;

  socialFields: SocialField[] = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
    { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle' },
    { key: 'tikTok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
    { key: 'snapchat', label: 'Snapchat', placeholder: 'https://snapchat.com/add/yourname' },
    { key: 'youTube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
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
        const sl = this.localConfig!.socialLinks;
        if (!sl.facebook) sl.facebook = '';
        if (!sl.instagram) sl.instagram = '';
        if (!sl.twitter) sl.twitter = '';
        if (!sl.tikTok) sl.tikTok = '';
        if (!sl.snapchat) sl.snapchat = '';
        if (!sl.youTube) sl.youTube = '';
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
        this.saveErr.set(err.message || 'Failed to save social links');
      }
    });
  }
}
