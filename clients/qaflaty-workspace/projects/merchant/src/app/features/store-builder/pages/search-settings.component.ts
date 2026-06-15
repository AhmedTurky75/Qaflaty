import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { ProductPropertyDefinitionDto } from 'shared';

interface SearchSettingsLocal {
  enableTextSearch: boolean;
  enableCategoryFilter: boolean;
  enablePriceFilter: boolean;
  enablePropertyFilters: boolean;
  filterablePropertyDefinitionIds: string[];
  allowedSortOptions: string[];
}

@Component({
  selector: 'app-search-settings',
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
          <h1 class="text-lg font-semibold text-gray-900">Search &amp; Filters</h1>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading()) {
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500">Loading search settings...</p>
          </div>
        }

        @if (loadErr()) {
          <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700">{{ loadErr() }}</p>
          </div>
        }

        @if (!loading() && localSettings) {
          <div class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 class="text-base font-semibold text-gray-900 mb-4">Search Options</h2>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Enable Text Search</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localSettings!.enableTextSearch" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Category Filter</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localSettings!.enableCategoryFilter" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Price Range Filter</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localSettings!.enablePriceFilter" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Custom Property Filters</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localSettings!.enablePropertyFilters" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Filterable Property Definitions Picker (shown only when toggle is on) -->
            @if (localSettings!.enablePropertyFilters) {
              <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h2 class="text-base font-semibold text-gray-900 mb-1">Filterable Properties</h2>
                <p class="text-sm text-gray-500 mb-4">Choose which product properties appear as filters on your storefront. Only properties marked as <em>filterable</em> are listed here.</p>

                @if (filterableDefinitions().length === 0) {
                  <p class="text-sm text-gray-400">
                    No filterable property definitions found.
                    <a routerLink="/products/properties" class="text-blue-600 hover:underline">Create one</a>
                    and mark it as filterable.
                  </p>
                } @else {
                  <div class="space-y-3">
                    @for (def of filterableDefinitions(); track def.id) {
                      <label class="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="isDefinitionSelected(def.id)"
                          (change)="toggleDefinition(def.id, $event)"
                          class="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <p class="text-sm font-medium text-gray-800">{{ def.displayName }}</p>
                          <p class="text-xs text-gray-400">{{ def.type }}{{ def.options.length > 0 ? ' · ' + def.options.join(', ') : '' }}</p>
                        </div>
                      </label>
                    }
                  </div>
                }
              </div>
            }

            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 class="text-base font-semibold text-gray-900 mb-4">Allowed Sort Options</h2>
              <div class="space-y-3">
                @for (opt of sortOptionList; track opt.value) {
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      [checked]="isSortOptionEnabled(opt.value)"
                      (change)="toggleSortOption(opt.value, $event)"
                      class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">{{ opt.label }}</span>
                  </label>
                }
              </div>
            </div>

            @if (saved()) {
              <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p class="text-green-700 text-sm font-medium">Search settings saved successfully.</p>
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
export class SearchSettingsComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);

  localSettings: SearchSettingsLocal | null = null;
  filterableDefinitions = signal<ProductPropertyDefinitionDto[]>([]);

  sortOptionList = [
    { value: 'PriceAsc', label: 'Price: Low to High' },
    { value: 'PriceDesc', label: 'Price: High to Low' },
    { value: 'Newest', label: 'Newest First' },
    { value: 'NameAsc', label: 'Name A-Z' },
    { value: 'NameDesc', label: 'Name Z-A' },
    { value: 'BestSelling', label: 'Best Selling' },
  ];

  ngOnInit(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loadErr.set('No store selected');
      this.loading.set(false);
      return;
    }

    // Load config and property definitions in parallel
    let configDone = false;
    let defsDone = false;
    const checkDone = () => { if (configDone && defsDone) this.loading.set(false); };

    this.builderService.getConfiguration(storeId).subscribe({
      next: (config) => {
        if (config.searchSettings) {
          this.localSettings = { ...config.searchSettings };
        } else {
          this.localSettings = {
            enableTextSearch: true,
            enableCategoryFilter: true,
            enablePriceFilter: true,
            enablePropertyFilters: false,
            filterablePropertyDefinitionIds: [],
            allowedSortOptions: ['Newest', 'PriceAsc', 'PriceDesc'],
          };
        }
        configDone = true;
        checkDone();
      },
      error: (err) => {
        this.loadErr.set(err.message || 'Failed to load configuration');
        this.loading.set(false);
      }
    });

    this.builderService.getProductPropertyDefinitions(storeId).subscribe({
      next: (defs) => {
        this.filterableDefinitions.set(defs.filter(d => d.isFilterable));
        defsDone = true;
        checkDone();
      },
      error: () => {
        // Non-fatal: just show no definitions
        defsDone = true;
        checkDone();
      }
    });
  }

  isDefinitionSelected(id: string): boolean {
    return this.localSettings?.filterablePropertyDefinitionIds.includes(id) ?? false;
  }

  toggleDefinition(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!this.localSettings) return;
    const current = this.localSettings.filterablePropertyDefinitionIds;
    if (checked && !current.includes(id)) {
      this.localSettings = { ...this.localSettings, filterablePropertyDefinitionIds: [...current, id] };
    } else if (!checked) {
      this.localSettings = { ...this.localSettings, filterablePropertyDefinitionIds: current.filter(v => v !== id) };
    }
  }

  isSortOptionEnabled(value: string): boolean {
    return this.localSettings?.allowedSortOptions.includes(value) ?? false;
  }

  toggleSortOption(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!this.localSettings) return;
    const current = this.localSettings.allowedSortOptions;
    if (checked && !current.includes(value)) {
      this.localSettings = { ...this.localSettings, allowedSortOptions: [...current, value] };
    } else if (!checked) {
      this.localSettings = { ...this.localSettings, allowedSortOptions: current.filter(v => v !== value) };
    }
  }

  save(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.localSettings) return;
    this.saving.set(true);
    this.saved.set(false);
    this.saveErr.set(null);

    this.builderService.updateSearchSettings(storeId, this.localSettings).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveErr.set(err.message || 'Failed to save search settings');
      }
    });
  }
}
