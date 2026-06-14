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

        <!-- Add / Edit Zone Form -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-700">
              {{ editingZoneId() ? 'Edit Zone' : 'Add Zone' }}
            </h4>
            @if (editingZoneId()) {
              <button
                (click)="cancelEdit()"
                class="text-xs text-gray-500 hover:text-gray-700 underline"
              >Cancel</button>
            }
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Level</label>
              <select
                [(ngModel)]="newZone.level"
                (ngModelChange)="onLevelChange()"
                [disabled]="!!editingZoneId()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="Country">Country</option>
                <option value="City">City</option>
                <option value="District">District</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <select
                [ngModel]="selectedCountryNumeric()"
                (ngModelChange)="onCountryChange($event)"
                [disabled]="!!editingZoneId()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  [ngModel]="selectedCityId()"
                  (ngModelChange)="onCityChange($event)"
                  [disabled]="!!editingZoneId()"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  [ngModel]="selectedDistrictId()"
                  (ngModelChange)="onDistrictChange($event)"
                  [disabled]="!!editingZoneId()"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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

          @if (saveErr()) {
            <p class="text-sm text-red-600">{{ saveErr() }}</p>
          }

          <button
            (click)="saveZone()"
            [disabled]="saving() || !canSave()"
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving() ? 'Saving...' : (editingZoneId() ? 'Update Zone' : 'Add Zone') }}
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
              <div
                class="flex items-center justify-between p-3 border rounded-lg transition-colors"
                [class.border-blue-300]="editingZoneId() === zone.id"
                [class.bg-blue-50]="editingZoneId() === zone.id"
                [class.border-red-200]="!zone.isDeliveryEnabled && editingZoneId() !== zone.id"
                [class.bg-red-50]="!zone.isDeliveryEnabled && editingZoneId() !== zone.id"
                [class.border-gray-200]="zone.isDeliveryEnabled && editingZoneId() !== zone.id"
              >
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

                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-600">
                    @if (zone.customDeliveryFee != null) {
                      <span class="font-medium">{{ zone.customDeliveryFee }} {{ zone.feeCurrency }}</span>
                    } @else {
                      <span class="text-gray-400 text-xs">Inherited fee</span>
                    }
                  </span>

                  <!-- Edit button -->
                  <button
                    (click)="startEdit(zone)"
                    [disabled]="deleting() === zone.id"
                    title="Edit zone"
                    class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-40"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>

                  <!-- Delete button -->
                  <button
                    (click)="deleteZone(zone)"
                    [disabled]="deleting() === zone.id || saving()"
                    title="Delete zone"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                  >
                    @if (deleting() === zone.id) {
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    }
                  </button>
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
  deleting = signal<string | null>(null);
  saveErr = signal<string | null>(null);
  editingZoneId = signal<string | null>(null);

  countries = COUNTRIES;
  selectedCountryNumeric = signal<number | null>(null);
  selectedCityId = signal<number | null>(null);
  selectedDistrictId = signal<number | null>(null);

  newZone = {
    level: 'Country' as ZoneLevel,
    referenceId: 0,
    isDeliveryEnabled: true,
    customDeliveryFee: null as number | null,
    feeCurrency: 'SAR'
  };

  availableCities = computed(() => {
    const n = this.selectedCountryNumeric();
    if (!n) return [] as City[];
    return CITIES[n] ?? [];
  });

  availableDistricts = computed(() => {
    const id = this.selectedCityId();
    if (!id) return [] as District[];
    return DISTRICTS[id] ?? [];
  });

  canSave = computed(() => {
    if (!this.selectedCountryNumeric()) return false;
    if (this.newZone.level === 'City' && !this.selectedCityId()) return false;
    if (this.newZone.level === 'District' && !this.selectedDistrictId()) return false;
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

  startEdit(zone: DeliveryZoneDto): void {
    this.editingZoneId.set(zone.id);
    this.saveErr.set(null);

    this.newZone.level = zone.level as ZoneLevel;
    this.newZone.isDeliveryEnabled = zone.isDeliveryEnabled;
    this.newZone.customDeliveryFee = zone.customDeliveryFee ?? null;
    this.newZone.feeCurrency = zone.feeCurrency ?? 'SAR';
    this.newZone.referenceId = zone.referenceId;

    // Restore the geographic selects
    if (zone.level === 'Country') {
      this.selectedCountryNumeric.set(zone.referenceId);
      this.selectedCityId.set(null);
      this.selectedDistrictId.set(null);
    } else if (zone.level === 'City') {
      const city = this.findCity(zone.referenceId);
      this.selectedCountryNumeric.set(city?.countryIsoNumeric ?? null);
      this.selectedCityId.set(zone.referenceId);
      this.selectedDistrictId.set(null);
    } else {
      const district = this.findDistrict(zone.referenceId);
      const city = district ? this.findCity(district.cityId) : null;
      this.selectedCountryNumeric.set(city?.countryIsoNumeric ?? null);
      this.selectedCityId.set(district?.cityId ?? null);
      this.selectedDistrictId.set(zone.referenceId);
    }

    // Scroll form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingZoneId.set(null);
    this.saveErr.set(null);
    this.resetForm();
  }

  onLevelChange(): void {
    this.selectedCityId.set(null);
    this.selectedDistrictId.set(null);
    this.updateReferenceId();
  }

  onCountryChange(value: number | null): void {
    this.selectedCountryNumeric.set(value);
    this.selectedCityId.set(null);
    this.selectedDistrictId.set(null);
    this.updateReferenceId();
  }

  onCityChange(value: number | null): void {
    this.selectedCityId.set(value);
    this.selectedDistrictId.set(null);
    this.updateReferenceId();
  }

  onDistrictChange(value: number | null): void {
    this.selectedDistrictId.set(value);
    this.updateReferenceId();
  }

  private updateReferenceId(): void {
    if (this.newZone.level === 'Country') {
      this.newZone.referenceId = this.selectedCountryNumeric() ?? 0;
    } else if (this.newZone.level === 'City') {
      this.newZone.referenceId = this.selectedCityId() ?? 0;
    } else {
      this.newZone.referenceId = this.selectedDistrictId() ?? 0;
    }
  }

  saveZone(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.canSave()) return;

    this.saving.set(true);
    this.saveErr.set(null);

    this.builderService.upsertDeliveryZone(storeId, {
      level: this.newZone.level,
      referenceId: this.newZone.referenceId,
      isDeliveryEnabled: this.newZone.isDeliveryEnabled,
      customDeliveryFee: this.newZone.customDeliveryFee ?? undefined,
      feeCurrency: this.newZone.feeCurrency
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editingZoneId.set(null);
        this.resetForm();
        this.loadZones();
      },
      error: (err) => {
        this.saving.set(false);
        this.saveErr.set(err.error?.message || err.message || 'Failed to save zone');
      }
    });
  }

  deleteZone(zone: DeliveryZoneDto): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    if (!confirm(`Delete the ${zone.level} zone "${this.getZoneName(zone)}"? This cannot be undone.`)) return;

    // If we're editing this zone, cancel the edit
    if (this.editingZoneId() === zone.id) {
      this.cancelEdit();
    }

    this.deleting.set(zone.id);
    this.builderService.deleteDeliveryZone(storeId, zone.id).subscribe({
      next: () => {
        this.deleting.set(null);
        this.zones.update(list => list.filter(z => z.id !== zone.id));
      },
      error: (err) => {
        this.deleting.set(null);
        alert(err.error?.message || err.message || 'Failed to delete zone');
      }
    });
  }

  private resetForm(): void {
    this.newZone.level = 'Country';
    this.newZone.referenceId = 0;
    this.newZone.isDeliveryEnabled = true;
    this.newZone.customDeliveryFee = null;
    this.newZone.feeCurrency = 'SAR';
    this.selectedCountryNumeric.set(null);
    this.selectedCityId.set(null);
    this.selectedDistrictId.set(null);
  }

  getZoneName(zone: DeliveryZoneDto): string {
    if (zone.level === 'Country') {
      const c = COUNTRIES.find(c => c.isoNumeric === zone.referenceId);
      return c ? `${c.flag} ${c.name}` : `Country #${zone.referenceId}`;
    }
    if (zone.level === 'City') {
      const city = this.findCity(zone.referenceId);
      if (city) {
        const country = COUNTRIES.find(c => c.isoNumeric === city.countryIsoNumeric);
        return `${country?.flag ?? ''} ${city.name}`;
      }
      return `City #${zone.referenceId}`;
    }
    if (zone.level === 'District') {
      const d = this.findDistrict(zone.referenceId);
      return d ? d.name : `District #${zone.referenceId}`;
    }
    return `#${zone.referenceId}`;
  }

  private findCity(cityId: number) {
    for (const cities of Object.values(CITIES)) {
      const city = cities.find(c => c.id === cityId);
      if (city) return city;
    }
    return null;
  }

  private findDistrict(districtId: number) {
    for (const districts of Object.values(DISTRICTS)) {
      const d = districts.find(d => d.id === districtId);
      if (d) return d;
    }
    return null;
  }
}
