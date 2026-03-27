import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreConfigurationDto, PaymentMethodAdjustment } from 'shared';
import { BuilderService } from './services/builder.service';
import { inject } from '@angular/core';
import { StoreContextService } from '../../core/services/store-context.service';

@Component({
  selector: 'app-configuration-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Page Toggles Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Page Settings</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">About Page</label>
            <input type="checkbox" [(ngModel)]="localConfig.pageToggles.aboutPage" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Contact Page</label>
            <input type="checkbox" [(ngModel)]="localConfig.pageToggles.contactPage" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">FAQ Page</label>
            <input type="checkbox" [(ngModel)]="localConfig.pageToggles.faqPage" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Terms Page</label>
            <input type="checkbox" [(ngModel)]="localConfig.pageToggles.termsPage" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Privacy Page</label>
            <input type="checkbox" [(ngModel)]="localConfig.pageToggles.privacyPage" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Shipping & Returns Page</label>
            <input type="checkbox" [(ngModel)]="localConfig.pageToggles.shippingReturnsPage" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Cart Page</label>
            <input type="checkbox" [(ngModel)]="localConfig.pageToggles.cartPage" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <!-- Feature Toggles Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Feature Settings</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Wishlist</label>
            <input type="checkbox" [(ngModel)]="localConfig.featureToggles.wishlist" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Product Reviews</label>
            <input type="checkbox" [(ngModel)]="localConfig.featureToggles.reviews" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Promo Codes</label>
            <input type="checkbox" [(ngModel)]="localConfig.featureToggles.promoCodes" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Newsletter</label>
            <input type="checkbox" [(ngModel)]="localConfig.featureToggles.newsletter" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Product Search</label>
            <input type="checkbox" [(ngModel)]="localConfig.featureToggles.productSearch" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Social Links</label>
            <input type="checkbox" [(ngModel)]="localConfig.featureToggles.socialLinks" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Analytics</label>
            <input type="checkbox" [(ngModel)]="localConfig.featureToggles.analytics" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <!-- Customer Auth Settings Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Customer Authentication</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Authentication Mode</label>
            <select
              [(ngModel)]="localConfig.customerAuthSettings.mode"
              (change)="onConfigChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GuestOnly">Guest Only</option>
              <option value="Required">Required</option>
              <option value="Optional">Optional</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Allow Guest Checkout</label>
            <input type="checkbox" [(ngModel)]="localConfig.customerAuthSettings.allowGuestCheckout" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Require Email Verification</label>
            <input type="checkbox" [(ngModel)]="localConfig.customerAuthSettings.requireEmailVerification" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700">Require OTP on Place Order</label>
              <p class="text-xs text-gray-500 mt-0.5">Customer must verify email OTP before order is confirmed</p>
            </div>
            <input type="checkbox" [(ngModel)]="localConfig.customerAuthSettings.requireOtpOnPlaceOrder" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <!-- Search Settings Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Search & Filter Settings</h3>
          <button
            (click)="saveSearchSettings()"
            [disabled]="savingSearch()"
            class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {{ savingSearch() ? 'Saving...' : 'Save Search' }}
          </button>
        </div>
        @if (searchSettings()) {
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">Enable Text Search</label>
              <input type="checkbox" [(ngModel)]="searchSettings()!.enableTextSearch" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">Category Filter</label>
              <input type="checkbox" [(ngModel)]="searchSettings()!.enableCategoryFilter" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">Price Range Filter</label>
              <input type="checkbox" [(ngModel)]="searchSettings()!.enablePriceFilter" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">Custom Property Filters</label>
              <input type="checkbox" [(ngModel)]="searchSettings()!.enablePropertyFilters" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Allowed Sort Options</label>
              <div class="space-y-2">
                @for (opt of sortOptionList; track opt.value) {
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [checked]="isSortOptionEnabled(opt.value)"
                      (change)="toggleSortOption(opt.value, $event)"
                      class="h-4 w-4 text-blue-600 rounded"
                    />
                    <span class="text-sm text-gray-700">{{ opt.label }}</span>
                  </label>
                }
              </div>
            </div>
          </div>
        } @else {
          <p class="text-sm text-gray-500">Loading search settings...</p>
        }
      </div>

      <!-- Payment Method Adjustments Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Payment Method Fees / Discounts</h3>
            <p class="text-sm text-gray-500 mt-0.5">Add surcharges or discounts to incentivize specific payment methods</p>
          </div>
          <button
            (click)="savePaymentAdjustments()"
            [disabled]="savingPayments()"
            class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {{ savingPayments() ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div class="space-y-3">
          @for (adj of paymentAdjustments(); track adj.id; let i = $index) {
            <div class="border border-gray-200 rounded-lg p-3 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Adjustment {{ i + 1 }}</span>
                <button (click)="removeAdjustment(i)" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Payment Method</label>
                  <select [(ngModel)]="adj.paymentMethod" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Mada">Mada</option>
                    <option value="ApplePay">Apple Pay</option>
                    <option value="STCPay">STC Pay</option>
                    <option value="BankTransfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Type</label>
                  <select [(ngModel)]="adj.adjustmentType" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Fixed">Fixed Amount</option>
                    <option value="Percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">
                    Value <span class="text-gray-400">(negative = discount, positive = fee)</span>
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="adj.value"
                    step="0.01"
                    placeholder="-5 or 10"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Display Label (optional)</label>
                  <input
                    type="text"
                    [(ngModel)]="adj.displayLabel"
                    placeholder="e.g. COD fee"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          }

          <button
            (click)="addAdjustment()"
            class="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-500 text-sm"
          >
            + Add Payment Adjustment
          </button>
        </div>
      </div>

      <!-- Communication Settings Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Communication Settings</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable WhatsApp</label>
            <input type="checkbox" [(ngModel)]="localConfig.communicationSettings.whatsAppEnabled" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          @if (localConfig.communicationSettings.whatsAppEnabled) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
              <input type="text" [(ngModel)]="localConfig.communicationSettings.whatsAppNumber" (change)="onConfigChange()" placeholder="+966XXXXXXXXX" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Default Message</label>
              <textarea [(ngModel)]="localConfig.communicationSettings.whatsAppDefaultMessage" (change)="onConfigChange()" rows="3" placeholder="Hello! I'm interested in..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
          }
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable Live Chat</label>
            <input type="checkbox" [(ngModel)]="localConfig.communicationSettings.liveChatEnabled" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable AI Chatbot</label>
            <input type="checkbox" [(ngModel)]="localConfig.communicationSettings.aiChatbotEnabled" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          @if (localConfig.communicationSettings.aiChatbotEnabled) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chatbot Name</label>
              <input type="text" [(ngModel)]="localConfig.communicationSettings.aiChatbotName" (change)="onConfigChange()" placeholder="Assistant" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          }
        </div>
      </div>

      <!-- Localization Settings Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Localization</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
            <select [(ngModel)]="localConfig.localizationSettings.defaultLanguage" (change)="onConfigChange()" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable Bilingual</label>
            <input type="checkbox" [(ngModel)]="localConfig.localizationSettings.enableBilingual" (change)="onConfigChange()" class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Default Direction</label>
            <select [(ngModel)]="localConfig.localizationSettings.defaultDirection" (change)="onConfigChange()" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ltr">Left to Right (LTR)</option>
              <option value="rtl">Right to Left (RTL)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConfigurationPanelComponent implements OnInit {
  @Input() config!: StoreConfigurationDto;
  @Output() configChange = new EventEmitter<StoreConfigurationDto>();

  private builderService = inject(BuilderService);
  private storeContext = inject(StoreContextService);

  localConfig!: StoreConfigurationDto;

  searchSettings = signal<{
    enableTextSearch: boolean;
    enableCategoryFilter: boolean;
    enablePriceFilter: boolean;
    enablePropertyFilters: boolean;
    filterablePropertyDefinitionIds: string[];
    allowedSortOptions: string[];
  } | null>(null);

  paymentAdjustments = signal<PaymentMethodAdjustment[]>([]);
  savingSearch = signal(false);
  savingPayments = signal(false);

  sortOptionList = [
    { value: 'PriceAsc', label: 'Price: Low to High' },
    { value: 'PriceDesc', label: 'Price: High to Low' },
    { value: 'Newest', label: 'Newest First' },
    { value: 'NameAsc', label: 'Name A-Z' },
    { value: 'NameDesc', label: 'Name Z-A' },
    { value: 'BestSelling', label: 'Best Selling' },
  ];

  ngOnInit(): void {
    this.localConfig = JSON.parse(JSON.stringify(this.config));
    if (this.localConfig.customerAuthSettings.requireOtpOnPlaceOrder === undefined) {
      this.localConfig.customerAuthSettings.requireOtpOnPlaceOrder = false;
    }

    // Initialize from config (now included in configuration response)
    if (this.config.searchSettings) {
      this.searchSettings.set({ ...this.config.searchSettings });
    } else {
      this.searchSettings.set({
        enableTextSearch: true, enableCategoryFilter: true, enablePriceFilter: true,
        enablePropertyFilters: false, filterablePropertyDefinitionIds: [], allowedSortOptions: ['Newest', 'PriceAsc', 'PriceDesc']
      });
    }

    if (this.config.paymentMethodAdjustments) {
      this.paymentAdjustments.set(this.config.paymentMethodAdjustments.map(a => ({ ...a })));
    }
  }

  isSortOptionEnabled(value: string): boolean {
    return this.searchSettings()?.allowedSortOptions.includes(value) ?? false;
  }

  toggleSortOption(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const s = this.searchSettings();
    if (!s) return;
    const current = s.allowedSortOptions;
    if (checked && !current.includes(value)) {
      this.searchSettings.set({ ...s, allowedSortOptions: [...current, value] });
    } else if (!checked) {
      this.searchSettings.set({ ...s, allowedSortOptions: current.filter(v => v !== value) });
    }
  }

  saveSearchSettings(): void {
    const storeId = this.storeContext.currentStoreId();
    const s = this.searchSettings();
    if (!storeId || !s) return;
    this.savingSearch.set(true);
    this.builderService.updateSearchSettings(storeId, s).subscribe({
      next: () => { this.savingSearch.set(false); alert('Search settings saved!'); },
      error: (err) => { this.savingSearch.set(false); alert(`Failed: ${err.message}`); }
    });
  }

  addAdjustment(): void {
    this.paymentAdjustments.update(list => [
      ...list,
      { id: crypto.randomUUID(), paymentMethod: 'COD', adjustmentType: 'Fixed', value: 0 } as PaymentMethodAdjustment
    ]);
  }

  removeAdjustment(index: number): void {
    this.paymentAdjustments.update(list => list.filter((_, i) => i !== index));
  }

  savePaymentAdjustments(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;
    this.savingPayments.set(true);
    const adjustments = this.paymentAdjustments().map(a => ({
      paymentMethod: a.paymentMethod,
      adjustmentType: a.adjustmentType,
      value: a.value,
      displayLabel: a.displayLabel
    }));
    this.builderService.setPaymentAdjustments(storeId, { adjustments }).subscribe({
      next: () => { this.savingPayments.set(false); alert('Payment adjustments saved!'); },
      error: (err) => { this.savingPayments.set(false); alert(`Failed: ${err.message}`); }
    });
  }

  onConfigChange(): void {
    this.configChange.emit(this.localConfig);
  }
}
