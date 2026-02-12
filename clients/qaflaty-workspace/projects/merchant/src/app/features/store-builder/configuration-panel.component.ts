import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreConfigurationDto } from 'shared';

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
            <input
              type="checkbox"
              [(ngModel)]="localConfig.pageToggles.aboutPage"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Contact Page</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.pageToggles.contactPage"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">FAQ Page</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.pageToggles.faqPage"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Terms Page</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.pageToggles.termsPage"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Privacy Page</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.pageToggles.privacyPage"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Shipping & Returns Page</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.pageToggles.shippingReturnsPage"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Cart Page</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.pageToggles.cartPage"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Feature Toggles Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Feature Settings</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Wishlist</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.featureToggles.wishlist"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Product Reviews</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.featureToggles.reviews"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Promo Codes</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.featureToggles.promoCodes"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Newsletter</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.featureToggles.newsletter"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Product Search</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.featureToggles.productSearch"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Social Links</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.featureToggles.socialLinks"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Analytics</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.featureToggles.analytics"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
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
            <input
              type="checkbox"
              [(ngModel)]="localConfig.customerAuthSettings.allowGuestCheckout"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Require Email Verification</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.customerAuthSettings.requireEmailVerification"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Communication Settings Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Communication Settings</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable WhatsApp</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.communicationSettings.whatsAppEnabled"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          @if (localConfig.communicationSettings.whatsAppEnabled) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
              <input
                type="text"
                [(ngModel)]="localConfig.communicationSettings.whatsAppNumber"
                (change)="onConfigChange()"
                placeholder="+966XXXXXXXXX"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Default Message</label>
              <textarea
                [(ngModel)]="localConfig.communicationSettings.whatsAppDefaultMessage"
                (change)="onConfigChange()"
                rows="3"
                placeholder="Hello! I'm interested in..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          }
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable Live Chat</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.communicationSettings.liveChatEnabled"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable AI Chatbot</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.communicationSettings.aiChatbotEnabled"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          @if (localConfig.communicationSettings.aiChatbotEnabled) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chatbot Name</label>
              <input
                type="text"
                [(ngModel)]="localConfig.communicationSettings.aiChatbotName"
                (change)="onConfigChange()"
                placeholder="Assistant"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
            <select
              [(ngModel)]="localConfig.localizationSettings.defaultLanguage"
              (change)="onConfigChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Enable Bilingual</label>
            <input
              type="checkbox"
              [(ngModel)]="localConfig.localizationSettings.enableBilingual"
              (change)="onConfigChange()"
              class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Default Direction</label>
            <select
              [(ngModel)]="localConfig.localizationSettings.defaultDirection"
              (change)="onConfigChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
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

  localConfig!: StoreConfigurationDto;

  ngOnInit(): void {
    this.localConfig = JSON.parse(JSON.stringify(this.config));
  }

  onConfigChange(): void {
    this.configChange.emit(this.localConfig);
  }
}
