import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreConfigurationDto, PaymentMethodAdjustment, PaymentMethodOptionDto } from 'shared';
import { BuilderService } from './services/builder.service';
import { inject } from '@angular/core';
import { StoreContextService } from '../../core/services/store-context.service';

@Component({
  selector: 'app-configuration-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuration-panel.component.html',
  styleUrl: './configuration-panel.component.scss'
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
  paymentOptions = signal<PaymentMethodOptionDto[]>([]);
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

    // Load available payment method options from backend, then merge with stored adjustments
    this.builderService.getPaymentMethodOptions().subscribe(options => {
      this.paymentOptions.set(options);
      const stored = new Map(
        (this.config.paymentMethodAdjustments ?? []).map(a => [a.paymentMethod, a])
      );
      this.paymentAdjustments.set(
        options.map(opt => {
          const existing = stored.get(opt.key);
          return existing
            ? { ...existing }
            : { id: crypto.randomUUID(), paymentMethod: opt.key, adjustmentType: 'Fixed', value: 0, isEnabled: false,
                defaultLabel: opt.defaultLabel, defaultDescription: opt.defaultDescription };
        })
      );
    });
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

  savePaymentAdjustments(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;
    this.savingPayments.set(true);
    const adjustments = this.paymentAdjustments().map(a => ({
      paymentMethod: a.paymentMethod,
      adjustmentType: a.adjustmentType,
      value: a.value,
      displayLabel: a.displayLabel,
      isEnabled: a.isEnabled
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
