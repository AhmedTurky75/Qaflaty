import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreContextService } from '../../core/services/store-context.service';
import { BuilderService } from './services/builder.service';
import { ConfigurationPanelComponent } from './configuration-panel.component';
import { LayoutDesignPanelComponent } from './layout-design-panel.component';
import { PageEditorComponent } from './page-editor.component';
import { SectionEditorComponent } from './section-editor.component';
import { FaqManagerComponent } from './faq-manager.component';
import { DeliveryZonesPanelComponent } from './delivery-zones-panel.component';
import { ProductPropertiesPanelComponent } from './product-properties-panel.component';
import {
  StoreConfigurationDto,
  PageConfigurationDto,
  SectionConfigurationDto,
  PageSeoSettings,
  UpdateStoreConfigurationRequest,
  UpdatePageConfigurationRequest,
  CreateCustomPageRequest,
  UpdateSectionsRequest
} from 'shared';

type TabType = 'general' | 'layout' | 'pages' | 'faq' | 'delivery-zones' | 'product-properties';

@Component({
  selector: 'app-builder-layout',
  standalone: true,
  imports: [
    CommonModule,
    ConfigurationPanelComponent,
    LayoutDesignPanelComponent,
    PageEditorComponent,
    SectionEditorComponent,
    FaqManagerComponent,
    DeliveryZonesPanelComponent,
    ProductPropertiesPanelComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 class="text-2xl font-bold text-gray-900">Store Builder</h1>
          <p class="mt-1 text-sm text-gray-500">
            Configure your storefront appearance and functionality
          </p>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="bg-white rounded-lg shadow p-12 text-center">
            <p class="text-gray-500">Loading store configuration...</p>
          </div>
        </div>
      }

      <!-- Main Content -->
      @if (!loading() && config()) {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex gap-6">
            <!-- Sidebar Navigation -->
            <div class="w-64 flex-shrink-0">
              <nav class="bg-white rounded-lg shadow divide-y divide-gray-100">
                @for (tab of tabs; track tab.id) {
                  <button
                    (click)="setActiveTab(tab.id)"
                    [class.bg-blue-50]="activeTab() === tab.id"
                    [class.text-blue-700]="activeTab() === tab.id"
                    [class.border-l-4]="activeTab() === tab.id"
                    [class.border-blue-700]="activeTab() === tab.id"
                    class="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    <div class="flex items-center">
                      <span class="w-5 h-5 mr-3 text-gray-400" [innerHTML]="tab.icon"></span>
                      {{ tab.label }}
                    </div>
                  </button>
                }
              </nav>

              <!-- Save Button for config tabs -->
              @if (hasUnsavedChanges() && activeTab() !== 'pages' && activeTab() !== 'faq' && activeTab() !== 'delivery-zones' && activeTab() !== 'product-properties') {
                <button
                  (click)="saveConfiguration()"
                  [disabled]="saving()"
                  class="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {{ saving() ? 'Saving...' : 'Save Changes' }}
                </button>
              }
            </div>

            <!-- Content Area -->
            <div class="flex-1">
              @if (activeTab() === 'general') {
                <app-configuration-panel
                  [config]="config()!"
                  (configChange)="onConfigChange($event)"
                />
              }

              @if (activeTab() === 'layout') {
                <app-layout-design-panel
                  [config]="config()!"
                  (configChange)="onConfigChange($event)"
                />
              }

              @if (activeTab() === 'pages') {
                @if (editingPage()) {
                  <app-section-editor
                    [page]="editingPage()"
                    (save)="onSaveSections($event)"
                    (close)="closePageEditor()"
                  />
                } @else {
                  <app-page-editor
                    [pages]="pages()"
                    (editPage)="onEditPage($event)"
                    (togglePage)="onTogglePage($event)"
                    (deletePage)="onDeletePage($event)"
                    (createPage)="onCreatePage($event)"
                  />
                }
              }

              @if (activeTab() === 'faq') {
                <app-faq-manager />
              }

              @if (activeTab() === 'delivery-zones') {
                <app-delivery-zones-panel />
              }

              @if (activeTab() === 'product-properties') {
                <app-product-properties-panel />
              }
            </div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="bg-red-50 rounded-lg p-8 text-center">
            <p class="text-red-700">{{ error() }}</p>
          </div>
        </div>
      }
    </div>
  `
})
export class BuilderLayoutComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  activeTab = signal<TabType>('general');
  config = signal<StoreConfigurationDto | null>(null);
  pages = signal<PageConfigurationDto[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  hasUnsavedChanges = signal(false);
  editingPage = signal<PageConfigurationDto | null>(null);

  private originalConfig: StoreConfigurationDto | null = null;

  tabs = [
    { id: 'general' as TabType, label: 'General Settings', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>' },
    { id: 'layout' as TabType, label: 'Layout & Design', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>' },
    { id: 'pages' as TabType, label: 'Pages', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
    { id: 'faq' as TabType, label: 'FAQ Management', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
    { id: 'delivery-zones' as TabType, label: 'Delivery Zones', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' },
    { id: 'product-properties' as TabType, label: 'Product Properties', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>' },
  ];

  ngOnInit(): void {
    this.loadConfiguration();
  }

  setActiveTab(tab: TabType): void {
    if (this.hasUnsavedChanges()) {
      if (!confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
        return;
      }
      this.hasUnsavedChanges.set(false);
    }
    this.activeTab.set(tab);

    if (tab === 'pages' && this.pages().length === 0) {
      this.loadPages();
    }
  }

  loadConfiguration(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.error.set('No store selected');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.builderService.getConfiguration(storeId).subscribe({
      next: (config) => {
        this.config.set(config);
        this.originalConfig = JSON.parse(JSON.stringify(config));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load configuration');
        this.loading.set(false);
      }
    });
  }

  loadPages(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.builderService.getPages(storeId).subscribe({
      next: (pages) => this.pages.set(pages),
      error: (err) => console.error('Failed to load pages:', err)
    });
  }

  onConfigChange(updatedConfig: StoreConfigurationDto): void {
    this.config.set(updatedConfig);
    this.hasUnsavedChanges.set(true);
  }

  saveConfiguration(): void {
    const storeId = this.storeContext.currentStoreId();
    const currentConfig = this.config();
    if (!storeId || !currentConfig) return;

    const request: UpdateStoreConfigurationRequest = {
      pageToggles: currentConfig.pageToggles,
      featureToggles: currentConfig.featureToggles,
      customerAuthSettings: currentConfig.customerAuthSettings,
      communicationSettings: currentConfig.communicationSettings,
      aiAssistantSettings: currentConfig.aiAssistantSettings,
      localizationSettings: currentConfig.localizationSettings,
      socialLinks: currentConfig.socialLinks,
      headerVariant: currentConfig.headerVariant,
      footerVariant: currentConfig.footerVariant,
      productCardVariant: currentConfig.productCardVariant,
      productGridVariant: currentConfig.productGridVariant,
      taxSettings: currentConfig.taxSettings
    };

    this.saving.set(true);
    this.builderService.updateConfiguration(storeId, request).subscribe({
      next: (config) => {
        this.config.set(config);
        this.originalConfig = JSON.parse(JSON.stringify(config));
        this.hasUnsavedChanges.set(false);
        this.saving.set(false);
        alert('Configuration saved successfully!');
      },
      error: (err) => {
        this.saving.set(false);
        alert(`Failed to save configuration: ${err.message}`);
      }
    });
  }

  onEditPage(page: PageConfigurationDto): void {
    this.editingPage.set(page);
  }

  closePageEditor(): void {
    this.editingPage.set(null);
  }

  onSaveSections(data: { sections: SectionConfigurationDto[]; seoSettings: PageSeoSettings }): void {
    const storeId = this.storeContext.currentStoreId();
    const page = this.editingPage();
    if (!storeId || !page) return;

    const sectionsRequest: UpdateSectionsRequest = { sections: data.sections };
    const pageRequest: UpdatePageConfigurationRequest = {
      title: page.title,
      slug: page.slug,
      isEnabled: page.isEnabled,
      seoSettings: data.seoSettings,
      contentJson: page.contentJson
    };

    this.saving.set(true);
    this.builderService.updateSections(storeId, page.id, sectionsRequest).subscribe({
      next: () => {
        this.builderService.updatePage(storeId, page.id, pageRequest).subscribe({
          next: () => {
            this.saving.set(false);
            this.closePageEditor();
            this.loadPages();
            alert('Page updated successfully!');
          },
          error: (err) => {
            this.saving.set(false);
            alert(`Failed to update page SEO: ${err.message}`);
          }
        });
      },
      error: (err) => {
        this.saving.set(false);
        alert(`Failed to update sections: ${err.message}`);
      }
    });
  }

  onTogglePage(page: PageConfigurationDto): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    const request: UpdatePageConfigurationRequest = {
      title: page.title,
      slug: page.slug,
      isEnabled: page.isEnabled,
      seoSettings: page.seoSettings,
      contentJson: page.contentJson
    };

    this.builderService.updatePage(storeId, page.id, request).subscribe({
      next: (updatedPage) => {
        const pagesList = this.pages();
        const index = pagesList.findIndex(p => p.id === page.id);
        if (index !== -1) {
          pagesList[index] = updatedPage;
          this.pages.set([...pagesList]);
        }
      },
      error: (err) => {
        alert(`Failed to update page: ${err.message}`);
        page.isEnabled = !page.isEnabled;
      }
    });
  }

  onDeletePage(page: PageConfigurationDto): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.builderService.deleteCustomPage(storeId, page.id).subscribe({
      next: () => {
        this.loadPages();
        alert('Page deleted successfully!');
      },
      error: (err) => alert(`Failed to delete page: ${err.message}`)
    });
  }

  onCreatePage(request: CreateCustomPageRequest): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.builderService.createCustomPage(storeId, request).subscribe({
      next: () => {
        this.loadPages();
        alert('Page created successfully!');
      },
      error: (err) => alert(`Failed to create page: ${err.message}`)
    });
  }
}
