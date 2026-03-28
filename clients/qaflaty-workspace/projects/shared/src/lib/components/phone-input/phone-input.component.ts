import { Component, forwardRef, signal, computed, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ControlValueAccessor,
  AbstractControl,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { COUNTRIES, Country } from '../../models/geo-data';
import { PhoneService } from '../../services/phone.service';

@Component({
  selector: 'lib-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex gap-0">
      <!-- Country Code Selector -->
      <div class="relative">
        <button
          type="button"
          (click)="toggleDropdown()"
          class="flex items-center gap-1 px-3 py-2 border border-r-0 rounded-l-md bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[90px]"
          [class.border-gray-300]="!showError()"
          [class.border-red-400]="showError()"
        >
          <span class="text-base">{{ selectedCountry().flag }}</span>
          <span class="text-sm font-medium text-gray-700">{{ selectedCountry().dialCode }}</span>
          <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        @if (dropdownOpen()) {
          <div class="absolute top-full left-0 z-50 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-hidden">
            <!-- Search -->
            <div class="p-2 border-b border-gray-100">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search country..."
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                (click)="$event.stopPropagation()"
              />
            </div>
            <!-- List -->
            <div class="overflow-y-auto max-h-48">
              @for (country of filteredCountries(); track country.isoAlpha2) {
                <button
                  type="button"
                  (click)="selectCountry(country)"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                  [class.bg-blue-50]="country.isoAlpha2 === selectedCountry().isoAlpha2"
                >
                  <span class="text-base w-6">{{ country.flag }}</span>
                  <span class="flex-1 text-gray-700">{{ country.name }}</span>
                  <span class="text-gray-400 text-xs">{{ country.dialCode }}</span>
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Phone Number Input -->
      <input
        type="tel"
        [value]="phoneNumber()"
        (input)="onPhoneInput($event)"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        class="flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        [class.border-gray-300]="!showError()"
        [class.border-red-400]="showError()"
      />
    </div>

    @if (showError()) {
      <p class="mt-1 text-sm text-red-600">Invalid phone number for this country</p>
    }

    @if (dropdownOpen()) {
      <div class="fixed inset-0 z-40" (click)="closeDropdown()"></div>
    }
  `
})
export class PhoneInputComponent implements ControlValueAccessor, Validator, OnInit {
  private readonly phoneService = inject(PhoneService);

  @Output() regionCodeChange = new EventEmitter<string>();

  countries = COUNTRIES;
  selectedCountry = signal<Country>(COUNTRIES.find(c => c.isoAlpha2 === 'SA') ?? COUNTRIES[0]);
  phoneNumber = signal('');
  dropdownOpen = signal(false);
  isDisabled = signal(false);
  isTouched = signal(false);
  searchQuery = '';
  private searchSignal = signal('');

  filteredCountries = computed(() => {
    const q = this.searchSignal().toLowerCase();
    if (!q) return this.countries;
    return this.countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.isoAlpha2.toLowerCase().includes(q)
    );
  });

  currentInfo = computed(() => this.phoneService.getByRegion(this.selectedCountry().isoAlpha2));

  placeholder = computed(() => {
    const info = this.currentInfo();
    if (info?.exampleNumber) {
      const callingCode = '+' + info.callingCode;
      return info.exampleNumber.startsWith(callingCode)
        ? info.exampleNumber.slice(callingCode.length)
        : info.exampleNumber;
    }
    const examples: Record<string, string> = {
      'SA': '5XXXXXXXX', 'EG': '1XXXXXXXXX', 'AE': '5XXXXXXXX',
      'KW': '9XXXXXXX', 'QA': '3XXXXXXX', 'BH': '3XXXXXXX',
      'OM': '9XXXXXXX', 'JO': '7XXXXXXXX', 'LB': '3XXXXXXX',
    };
    return examples[this.selectedCountry().isoAlpha2] ?? 'Phone number';
  });

  isInvalid = computed(() => {
    const num = this.phoneNumber();
    if (!num) return false;
    const info = this.currentInfo();
    if (!info?.nationalNumberPattern) return false;
    try {
      return !new RegExp(`^(${info.nationalNumberPattern})$`).test(num);
    } catch {
      return false;
    }
  });

  showError = computed(() => this.isTouched() && this.isInvalid());

  ngOnInit(): void {
    this.phoneService.load();
    this.regionCodeChange.emit(this.selectedCountry().isoAlpha2);
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    const num = this.phoneNumber();
    if (!num) return null;
    const info = this.currentInfo();
    if (!info?.nationalNumberPattern) return null;
    try {
      return new RegExp(`^(${info.nationalNumberPattern})$`).test(num)
        ? null
        : { phoneInvalid: true };
    } catch {
      return null;
    }
  }

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    if (!value) { this.phoneNumber.set(''); return; }
    const match = value.match(/^(\+\d{1,4})(.*)$/);
    if (match) {
      const dialCode = match[1];
      // Sort by dialCode length descending so "+966" matches before "+9"
      const sorted = [...this.countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const country = sorted.find(c => value.startsWith(c.dialCode));
      if (country) {
        this.selectedCountry.set(country);
        this.regionCodeChange.emit(country.isoAlpha2);
        this.phoneNumber.set(value.slice(country.dialCode.length));
        return;
      }
      this.phoneNumber.set(match[2]);
    } else {
      this.phoneNumber.set(value);
    }
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }

  toggleDropdown(): void { this.dropdownOpen.update(v => !v); }
  closeDropdown(): void { this.dropdownOpen.set(false); }

  selectCountry(country: Country): void {
    this.selectedCountry.set(country);
    this.dropdownOpen.set(false);
    this.searchQuery = '';
    this.searchSignal.set('');
    this.regionCodeChange.emit(country.isoAlpha2);
    this.emitValue();
  }

  onSearchChange(q: string): void { this.searchSignal.set(q); }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    input.value = digits;
    this.phoneNumber.set(digits);
    this.isTouched.set(true);
    this.onTouched();
    this.emitValue();
  }

  private emitValue(): void {
    const num = this.phoneNumber();
    const code = this.selectedCountry().dialCode;
    this.onChange(num ? `${code}${num}` : '');
  }
}
