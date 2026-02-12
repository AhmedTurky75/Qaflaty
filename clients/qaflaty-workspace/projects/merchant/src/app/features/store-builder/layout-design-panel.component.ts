import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreConfigurationDto } from 'shared';

@Component({
  selector: 'app-layout-design-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header Variant Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Header Design</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Header Variant</label>
          <select
            [(ngModel)]="localConfig.headerVariant"
            (change)="onConfigChange()"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Centered">Centered</option>
            <option value="LeftAligned">Left Aligned</option>
            <option value="MinimalCentered">Minimal Centered</option>
            <option value="SplitNavigation">Split Navigation</option>
          </select>
          <p class="mt-2 text-xs text-gray-500">Choose the layout style for your store header</p>
        </div>
      </div>

      <!-- Footer Variant Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Footer Design</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Footer Variant</label>
          <select
            [(ngModel)]="localConfig.footerVariant"
            (change)="onConfigChange()"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="FourColumn">Four Column</option>
            <option value="ThreeColumn">Three Column</option>
            <option value="Minimal">Minimal</option>
            <option value="Stacked">Stacked</option>
          </select>
          <p class="mt-2 text-xs text-gray-500">Choose the layout style for your store footer</p>
        </div>
      </div>

      <!-- Product Card Variant Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Product Card Design</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Product Card Variant</label>
          <select
            [(ngModel)]="localConfig.productCardVariant"
            (change)="onConfigChange()"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Standard">Standard</option>
            <option value="Compact">Compact</option>
            <option value="Detailed">Detailed</option>
            <option value="WithHover">With Hover Effects</option>
          </select>
          <p class="mt-2 text-xs text-gray-500">Choose how individual products are displayed</p>
        </div>
      </div>

      <!-- Product Grid Variant Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Product Grid Layout</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Product Grid Variant</label>
          <select
            [(ngModel)]="localConfig.productGridVariant"
            (change)="onConfigChange()"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TwoColumn">2 Columns</option>
            <option value="ThreeColumn">3 Columns</option>
            <option value="FourColumn">4 Columns</option>
            <option value="Masonry">Masonry Layout</option>
          </select>
          <p class="mt-2 text-xs text-gray-500">Choose the grid layout for product collections</p>
        </div>
      </div>

      <!-- Social Links Section -->
      @if (config.featureToggles.socialLinks) {
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
              <input
                type="url"
                [(ngModel)]="localConfig.socialLinks.facebook"
                (change)="onConfigChange()"
                placeholder="https://facebook.com/yourstore"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
              <input
                type="url"
                [(ngModel)]="localConfig.socialLinks.instagram"
                (change)="onConfigChange()"
                placeholder="https://instagram.com/yourstore"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              <input
                type="url"
                [(ngModel)]="localConfig.socialLinks.twitter"
                (change)="onConfigChange()"
                placeholder="https://twitter.com/yourstore"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
              <input
                type="url"
                [(ngModel)]="localConfig.socialLinks.tikTok"
                (change)="onConfigChange()"
                placeholder="https://tiktok.com/@yourstore"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Snapchat</label>
              <input
                type="url"
                [(ngModel)]="localConfig.socialLinks.snapchat"
                (change)="onConfigChange()"
                placeholder="https://snapchat.com/add/yourstore"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
              <input
                type="url"
                [(ngModel)]="localConfig.socialLinks.youTube"
                (change)="onConfigChange()"
                placeholder="https://youtube.com/@yourstore"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class LayoutDesignPanelComponent implements OnInit {
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
