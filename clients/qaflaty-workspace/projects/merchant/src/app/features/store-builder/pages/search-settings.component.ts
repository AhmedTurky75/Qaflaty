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
  templateUrl: './search-settings.component.html',
  styleUrl: './search-settings.component.scss'
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
