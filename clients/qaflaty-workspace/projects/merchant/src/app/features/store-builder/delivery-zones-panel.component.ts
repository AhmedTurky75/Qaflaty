import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderService } from './services/builder.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { DeliveryZoneDto, COUNTRIES, CITIES, DISTRICTS, Country, City, District } from 'shared';

type ZoneLevel = 'Country' | 'City' | 'District';

@Component({
  selector: 'app-delivery-zones-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Delivery Zones</h3>
            <p class="text-sm text-gray-500 mt-0.5">
              Configure which areas you deliver to and set custom delivery fees.
              Zone resolution: District → City → Country → Store default.
            </p>
          </div>
        </div>

        <!-- Add Zone Form -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          <h4 class="text-sm font-semibold text-gray-700">Add / Update Zone</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Level</label>
              <select
                [(ngModel)]="newZone.level"
                (ngModelChange)="onLevelChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Country">Country</option>
                <option value="City">City</option>
                <option value="District">District</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <select
                [(ngModel)]="selectedCountryNumeric"
                (ngModelChange)="onCountryChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option [ngValue]="null">Select country...</option>
                @for (c of countries; track c.isoNumeric) {
                  <option [ngValue]="c.isoNumeric">{{ c.flag }} {{ c.name }}</option>
                }
              </select>
            </div>

            @if (newZone.level === 'City' || newZone.level === 'District') {
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">City</label>
                <select
                  [(ngModel)]="selectedCityId"
                  (ngModelChange)="onCityChange()"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option [ngValue]="null">Select city...</option>
                  @for (city of availableCities(); track city.id) {
                    <option [ngValue]="city.id">{{ city.name }}</option>
                  }
                </select>
              </div>
            }

            @if (newZone.level === 'District') {
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">District</label>
                <select
                  [(ngModel)]="selectedDistrictId"
                  (ngModelChange)="onDistrictChange()"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option [ngValue]="null">Select district...</option>
                  @for (d of availableDistricts(); track d.id) {
                    <option [ngValue]="d.id">{{ d.name }}</option>
                  }
                </select>
              </div>
            }
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="flex items-center gap-3 col-span-1">
              <label class="text-xs font-medium text-gray-600">Enable Delivery</label>
              <input type="checkbox" [(ngModel)]="newZone.isDeliveryEnabled" class="h-4 w-4 text-blue-600 rounded" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Custom Fee (leave blank = inherit)</label>
              <input
                type="number"
                [(ngModel)]="newZone.customDeliveryFee"
                min="0"
                step="0.01"
                placeholder="e.g. 25.00"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Currency</label>
              <select
                [(ngModel)]="newZone.feeCurrency"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SAR">SAR</option>
                <option value="EGP">EGP</option>
                <option value="AED">AED</option>
                <option value="KWD">KWD</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <button
            (click)="saveZone()"
            [disabled]="saving() || !canSave()"
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving() ? 'Saving...' : 'Save Zone' }}
          </button>
        </div>

        <!-- Existing Zones List -->
        @if (loading()) {
          <p class="text-sm text-gray-500 text-center py-4">Loading zones...</p>
        } @else if (zones().length === 0) {
          <div class="text-center py-8 text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p class="text-sm">No delivery zones configured yet.</p>
            <p class="text-xs mt-1">All orders will use the store's default delivery fee.</p>
          </div>
        } @else {
          <div class="space-y-2">
            <h4 class="text-sm font-semibold text-gray-700">Configured Zones ({{ zones().length }})</h4>
            @for (zone of zones(); track zone.id) {
              <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                   [class.border-red-200]="!zone.isDeliveryEnabled"
                   [class.bg-red-50]="!zone.isDeliveryEnabled">
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        [class.bg-blue-100]="zone.level === 'Country'"
                        [class.text-blue-700]="zone.level === 'Country'"
                        [class.bg-green-100]="zone.level === 'City'"
                        [class.text-green-700]="zone.level === 'City'"
                        [class.bg-purple-100]="zone.level === 'District'"
                        [class.text-purple-700]="zone.level === 'District'">
                    {{ zone.level }}
                  </span>
                  <span class="text-sm text-gray-700">{{ getZoneName(zone) }}</span>
                  @if (!zone.isDeliveryEnabled) {
                    <span class="text-xs text-red-600 font-medium">No Delivery</span>
                  }
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-600">
                  @if (zone.customDeliveryFee != null) {
                    <span class="font-medium">{{ zone.customDeliveryFee }} {{ zone.feeCurrency }}</span>
                  } @else {
                    <span class="text-gray-400 text-xs">Inherited fee</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class DeliveryZonesPanelComponent implements OnInit {
  private builderService = inject(BuilderService);
  private storeContext = inject(StoreContextService);

  zones = signal<DeliveryZoneDto[]>([]);
  loading = signal(true);
  saving = signal(false);

  countries = COUNTRIES;
  selectedCountryNumeric: number | null = null;
  selectedCityId: number | null = null;
  selectedDistrictId: number | null = null;

  newZone = {
    level: 'Country' as ZoneLevel,
    referenceId: 0,
    isDeliveryEnabled: true,
    customDeliveryFee: null as number | null,
    feeCurrency: 'SAR'
  };

  availableCities = computed(() => {
    if (!this.selectedCountryNumeric) return [] as City[];
    return CITIES[this.selectedCountryNumeric] ?? [];
  });

  availableDistricts = computed(() => {
    if (!this.selectedCityId) return [] as District[];
    return DISTRICTS[this.selectedCityId] ?? [];
  });

  canSave = computed(() => {
    if (!this.selectedCountryNumeric) return false;
    if (this.newZone.level === 'City' && !this.selectedCityId) return false;
    if (this.newZone.level === 'District' && !this.selectedDistrictId) return false;
    return true;
  });

  ngOnInit(): void {
    this.loadZones();
  }

  private loadZones(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;
    this.loading.set(true);
    this.builderService.getDeliveryZones(storeId).subscribe({
      next: (zones) => { this.zones.set(zones); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onLevelChange(): void {
    this.selectedCityId = null;
    this.selectedDistrictId = null;
    this.updateReferenceId();
  }

  onCountryChange(): void {
    this.selectedCityId = null;
    this.selectedDistrictId = null;
    this.updateReferenceId();
  }

  onCityChange(): void {
    this.selectedDistrictId = null;
    this.updateReferenceId();
  }

  onDistrictChange(): void {
    this.updateReferenceId();
  }

  private updateReferenceId(): void {
    if (this.newZone.level === 'Country') {
      this.newZone.referenceId = this.selectedCountryNumeric ?? 0;
    } else if (this.newZone.level === 'City') {
      this.newZone.referenceId = this.selectedCityId ?? 0;
    } else {
      this.newZone.referenceId = this.selectedDistrictId ?? 0;
    }
  }

  saveZone(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.canSave()) return;

    this.saving.set(true);
    this.builderService.upsertDeliveryZone(storeId, {
      level: this.newZone.level,
      referenceId: this.newZone.referenceId,
      isDeliveryEnabled: this.newZone.isDeliveryEnabled,
      customDeliveryFee: this.newZone.customDeliveryFee ?? undefined,
      feeCurrency: this.newZone.feeCurrency
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadZones();
        alert('Delivery zone saved!');
      },
      error: (err) => {
        this.saving.set(false);
        alert(`Failed to save zone: ${err.message}`);
      }
    });
  }

  getZoneName(zone: DeliveryZoneDto): string {
    if (zone.level === 'Country') {
      const c = COUNTRIES.find(c => c.isoNumeric === zone.referenceId);
      return c ? `${c.flag} ${c.name}` : `Country #${zone.referenceId}`;
    }
    if (zone.level === 'City') {
      for (const cities of Object.values(CITIES)) {
        const city = cities.find(c => c.id === zone.referenceId);
        if (city) {
          const country = COUNTRIES.find(c => c.isoNumeric === city.countryIsoNumeric);
          return `${country?.flag ?? ''} ${city.name}`;
        }
      }
      return `City #${zone.referenceId}`;
    }
    if (zone.level === 'District') {
      for (const districts of Object.values(DISTRICTS)) {
        const d = districts.find(d => d.id === zone.referenceId);
        if (d) return d.name;
      }
      return `District #${zone.referenceId}`;
    }
    return `#${zone.referenceId}`;
  }
}
