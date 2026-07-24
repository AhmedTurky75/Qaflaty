import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderService } from './services/builder.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { DeliveryZoneDto, COUNTRIES, CITIES, DISTRICTS, City, District } from 'shared';

type ZoneLevel = 'Country' | 'City' | 'District';

@Component({
  selector: 'app-delivery-zones-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-zones-panel.component.html',
  styleUrl: './delivery-zones-panel.component.scss'
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
