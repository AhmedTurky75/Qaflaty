import { Component, Input, Output, EventEmitter, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VariantOption, ProductVariant } from '../../models/product.model';
import { Money } from '../../models/store.model';

@Component({
  selector: 'app-variant-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      @for (option of variantOptions(); track option.name) {
        <div class="variant-option">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ option.name }}
          </label>

          @if (isColorOption(option.name)) {
            <!-- Color swatches -->
            <div class="flex flex-wrap gap-2">
              @for (value of option.values; track value) {
                <button
                  type="button"
                  (click)="selectOption(option.name, value)"
                  [class.ring-2]="isSelected(option.name, value)"
                  [class.ring-primary]="isSelected(option.name, value)"
                  [class.ring-offset-2]="isSelected(option.name, value)"
                  [class.opacity-50]="!isOptionAvailable(option.name, value)"
                  [class.cursor-not-allowed]="!isOptionAvailable(option.name, value)"
                  [disabled]="!isOptionAvailable(option.name, value)"
                  class="w-10 h-10 rounded-full border-2 border-gray-200 transition-all"
                  [style.background-color]="getColorCode(value)"
                  [title]="value"
                >
                  @if (!isOptionAvailable(option.name, value)) {
                    <span class="block w-full h-full relative">
                      <span class="absolute inset-0 flex items-center justify-center">
                        <span class="block w-8 h-0.5 bg-gray-400 transform rotate-45"></span>
                      </span>
                    </span>
                  }
                </button>
              }
            </div>
          } @else if (isSizeOption(option.name)) {
            <!-- Size buttons -->
            <div class="flex flex-wrap gap-2">
              @for (value of option.values; track value) {
                <button
                  type="button"
                  (click)="selectOption(option.name, value)"
                  [class.bg-primary]="isSelected(option.name, value)"
                  [class.text-white]="isSelected(option.name, value)"
                  [class.border-primary]="isSelected(option.name, value)"
                  [class.opacity-50]="!isOptionAvailable(option.name, value)"
                  [class.cursor-not-allowed]="!isOptionAvailable(option.name, value)"
                  [class.line-through]="!isOptionAvailable(option.name, value)"
                  [disabled]="!isOptionAvailable(option.name, value)"
                  class="min-w-[3rem] px-3 py-2 border rounded-lg text-sm font-medium transition-all hover:border-primary"
                >
                  {{ value }}
                </button>
              }
            </div>
          } @else {
            <!-- Dropdown for other options -->
            <select
              [value]="getSelectedValue(option.name)"
              (change)="onSelectChange(option.name, $event)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Select {{ option.name }}</option>
              @for (value of option.values; track value) {
                <option
                  [value]="value"
                  [disabled]="!isOptionAvailable(option.name, value)"
                >
                  {{ value }}
                  @if (!isOptionAvailable(option.name, value)) {
                    (Unavailable)
                  }
                </option>
              }
            </select>
          }
        </div>
      }

      <!-- Selected variant info -->
      @if (selectedVariant()) {
        <div class="pt-4 border-t">
          @if (selectedVariant()!.priceOverride) {
            <div class="text-lg font-semibold text-primary">
              {{ formatPrice(selectedVariant()!.priceOverride!) }}
            </div>
          }
          <div class="text-sm text-gray-600">
            @if (selectedVariant()!.inStock) {
              <span class="text-green-600">In Stock</span>
              @if (selectedVariant()!.quantity <= 5) {
                <span class="text-orange-500 ml-2">
                  Only {{ selectedVariant()!.quantity }} left!
                </span>
              }
            } @else if (selectedVariant()!.allowBackorder) {
              <span class="text-orange-500">Available for backorder</span>
            } @else {
              <span class="text-red-600">Out of Stock</span>
            }
          </div>
          @if (selectedVariant()!.sku) {
            <div class="text-xs text-gray-500 mt-1">
              SKU: {{ selectedVariant()!.sku }}
            </div>
          }
        </div>
      } @else if (hasSelectionStarted()) {
        <div class="pt-4 border-t text-sm text-orange-600">
          Please select all options to continue
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class VariantSelectorComponent {
  @Input() set options(value: VariantOption[]) {
    this.variantOptions.set(value || []);
  }

  @Input() set variants(value: ProductVariant[]) {
    this.productVariants.set(value || []);
  }

  @Input() basePrice?: Money;

  @Output() variantSelected = new EventEmitter<ProductVariant | null>();

  variantOptions = signal<VariantOption[]>([]);
  productVariants = signal<ProductVariant[]>([]);
  selectedOptions = signal<Record<string, string>>({});

  selectedVariant = computed<ProductVariant | null>(() => {
    const selected = this.selectedOptions();
    const options = this.variantOptions();
    const variants = this.productVariants();

    // Check if all options are selected
    if (options.length === 0 || Object.keys(selected).length !== options.length) {
      return null;
    }

    // Find variant matching all selected options
    return variants.find(variant =>
      options.every(opt => variant.attributes[opt.name] === selected[opt.name])
    ) || null;
  });

  hasSelectionStarted = computed(() =>
    Object.keys(this.selectedOptions()).length > 0
  );

  constructor() {
    // Emit variant changes
    effect(() => {
      const variant = this.selectedVariant();
      this.variantSelected.emit(variant);
    });
  }

  selectOption(optionName: string, value: string): void {
    const current = this.selectedOptions();
    this.selectedOptions.set({ ...current, [optionName]: value });
  }

  getSelectedValue(optionName: string): string {
    return this.selectedOptions()[optionName] || '';
  }

  isSelected(optionName: string, value: string): boolean {
    return this.selectedOptions()[optionName] === value;
  }

  isOptionAvailable(optionName: string, value: string): boolean {
    const selected = { ...this.selectedOptions() };
    selected[optionName] = value;

    // Check if any variant exists with current selection
    return this.productVariants().some(variant => {
      const isMatch = Object.entries(selected).every(
        ([key, val]) => variant.attributes[key] === val
      );
      return isMatch && (variant.inStock || variant.allowBackorder);
    });
  }

  onSelectChange(optionName: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.selectOption(optionName, value);
    }
  }

  isColorOption(name: string): boolean {
    const colorNames = ['color', 'colour', 'لون', 'اللون'];
    return colorNames.includes(name.toLowerCase());
  }

  isSizeOption(name: string): boolean {
    const sizeNames = ['size', 'مقاس', 'الحجم', 'القياس'];
    return sizeNames.includes(name.toLowerCase());
  }

  getColorCode(colorName: string): string {
    // Map common color names to CSS colors
    const colorMap: Record<string, string> = {
      // English
      'red': '#ef4444',
      'blue': '#3b82f6',
      'green': '#22c55e',
      'yellow': '#eab308',
      'orange': '#f97316',
      'purple': '#a855f7',
      'pink': '#ec4899',
      'black': '#1f2937',
      'white': '#ffffff',
      'gray': '#6b7280',
      'grey': '#6b7280',
      'brown': '#92400e',
      'navy': '#1e3a5f',
      'beige': '#d4c4a8',
      'cream': '#fffdd0',
      'gold': '#ffd700',
      'silver': '#c0c0c0',
      // Arabic
      'أحمر': '#ef4444',
      'أزرق': '#3b82f6',
      'أخضر': '#22c55e',
      'أصفر': '#eab308',
      'برتقالي': '#f97316',
      'بنفسجي': '#a855f7',
      'وردي': '#ec4899',
      'أسود': '#1f2937',
      'أبيض': '#ffffff',
      'رمادي': '#6b7280',
      'بني': '#92400e',
      'كحلي': '#1e3a5f',
      'بيج': '#d4c4a8',
      'ذهبي': '#ffd700',
      'فضي': '#c0c0c0'
    };

    return colorMap[colorName.toLowerCase()] || '#9ca3af';
  }

  formatPrice(price: Money): string {
    return `${price.amount.toFixed(2)} ${price.currency}`;
  }

  // Public method to reset selection
  reset(): void {
    this.selectedOptions.set({});
  }
}
