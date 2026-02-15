import { Component, Input, inject, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { StoreContextService } from '../../../../core/services/store-context.service';
import {
  ProductWithVariantsDto,
  ProductVariantDto,
  VariantOptionDto,
  InventoryMovementType,
  Currency
} from 'shared';

interface VariantOptionForm {
  name: string;
  values: string[];
}

@Component({
  selector: 'app-variant-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Product Variants</h3>
        @if (!hasVariants()) {
          <button
            type="button"
            (click)="enableVariants()"
            class="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            Add Variants
          </button>
        }
      </div>

      @if (!hasVariants() && !showVariantSetup()) {
        <p class="text-sm text-gray-500">
          This product has no variants. Add variants to offer different options like sizes or colors.
        </p>
      }

      <!-- Variant Setup -->
      @if (showVariantSetup()) {
        <div class="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 class="font-medium text-gray-900">Define Variant Options</h4>

          <!-- Existing Options -->
          @for (option of variantOptions(); track option.name; let i = $index) {
            <div class="flex items-start gap-4 bg-white p-4 rounded-lg border">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Option Name
                </label>
                <input
                  type="text"
                  [value]="option.name"
                  disabled
                  class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div class="flex-[2]">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Values (comma-separated)
                </label>
                <input
                  type="text"
                  [value]="option.values.join(', ')"
                  disabled
                  class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>
          }

          <!-- New Option Form -->
          <form [formGroup]="newOptionForm" (ngSubmit)="addVariantOption()" class="flex items-end gap-4 bg-white p-4 rounded-lg border border-dashed border-gray-300">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Option Name
              </label>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g., Color, Size"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div class="flex-[2]">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Values (comma-separated)
              </label>
              <input
                type="text"
                formControlName="values"
                placeholder="e.g., Red, Blue, Green"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              type="submit"
              [disabled]="newOptionForm.invalid || savingOption()"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (savingOption()) {
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Adding...
                </span>
              } @else {
                Add Option
              }
            </button>
          </form>

          @if (optionError()) {
            <p class="text-sm text-red-600">{{ optionError() }}</p>
          }
        </div>
      }

      <!-- Variants Table -->
      @if (hasVariants() || variants().length > 0) {
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-gray-900">Variant Combinations</h4>
            @if (canGenerateVariants()) {
              <button
                type="button"
                (click)="generateAllVariants()"
                [disabled]="generatingVariants()"
                class="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
              >
                @if (generatingVariants()) {
                  Generating...
                } @else {
                  Generate All Combinations
                }
              </button>
            }
          </div>

          @if (variants().length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    @for (option of variantOptions(); track option.name) {
                      <th class="px-4 py-3 text-left font-medium text-gray-700">{{ option.name }}</th>
                    }
                    <th class="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Price Override</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Stock</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  @for (variant of variants(); track variant.id) {
                    <tr class="hover:bg-gray-50">
                      @for (option of variantOptions(); track option.name) {
                        <td class="px-4 py-3">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {{ variant.attributes[option.name] }}
                          </span>
                        </td>
                      }
                      <td class="px-4 py-3">
                        @if (editingVariantId() === variant.id) {
                          <input
                            type="text"
                            [(ngModel)]="editForm.sku"
                            class="w-24 px-2 py-1 border rounded text-sm"
                          />
                        } @else {
                          {{ variant.sku }}
                        }
                      </td>
                      <td class="px-4 py-3">
                        @if (editingVariantId() === variant.id) {
                          <input
                            type="number"
                            [(ngModel)]="editForm.priceOverride"
                            class="w-24 px-2 py-1 border rounded text-sm"
                            step="0.01"
                          />
                        } @else {
                          @if (variant.priceOverride) {
                            {{ variant.priceOverride }} {{ variant.priceOverrideCurrency }}
                          } @else {
                            <span class="text-gray-400">-</span>
                          }
                        }
                      </td>
                      <td class="px-4 py-3">
                        @if (editingVariantId() === variant.id) {
                          <input
                            type="number"
                            [(ngModel)]="editForm.quantity"
                            class="w-20 px-2 py-1 border rounded text-sm"
                            min="0"
                          />
                        } @else {
                          <span [class.text-red-600]="variant.quantity <= 0" [class.text-orange-500]="variant.quantity > 0 && variant.quantity <= 5">
                            {{ variant.quantity }}
                          </span>
                        }
                      </td>
                      <td class="px-4 py-3">
                        @if (editingVariantId() === variant.id) {
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              (click)="saveVariant(variant)"
                              [disabled]="savingVariant()"
                              class="text-green-600 hover:text-green-800"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              (click)="cancelEdit()"
                              class="text-gray-600 hover:text-gray-800"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                        } @else {
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              (click)="editVariant(variant)"
                              class="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              (click)="showAdjustStock(variant)"
                              class="text-purple-600 hover:text-purple-800"
                              title="Adjust Stock"
                            >
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                              </svg>
                            </button>
                          </div>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="text-sm text-gray-500 text-center py-4">
              No variants created yet. Generate all combinations or add them individually.
            </p>
          }
        </div>
      }

      <!-- Stock Adjustment Modal -->
      @if (adjustingStockVariant()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">Adjust Stock</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity Change</label>
                <input
                  type="number"
                  [(ngModel)]="stockAdjustment.quantity"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter positive or negative number"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  [(ngModel)]="stockAdjustment.type"
                  class="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Adjustment">Manual Adjustment</option>
                  <option value="Restock">Restock</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Return">Return</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  [(ngModel)]="stockAdjustment.reason"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                (click)="cancelStockAdjustment()"
                class="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="submitStockAdjustment()"
                [disabled]="savingStock()"
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                @if (savingStock()) {
                  Saving...
                } @else {
                  Save
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Add New Variant Form -->
      @if (hasVariants() && variantOptions().length > 0) {
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-medium text-gray-900 mb-4">Add New Variant</h4>
          <form [formGroup]="newVariantForm" (ngSubmit)="addNewVariant()" class="space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (option of variantOptions(); track option.name) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ option.name }}</label>
                  <select
                    [formControlName]="'attr_' + option.name"
                    class="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select...</option>
                    @for (value of option.values; track value) {
                      <option [value]="value">{{ value }}</option>
                    }
                  </select>
                </div>
              }
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  formControlName="sku"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Price Override</label>
                <input
                  type="number"
                  formControlName="priceOverride"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  formControlName="quantity"
                  min="0"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div class="flex justify-end">
              <button
                type="submit"
                [disabled]="newVariantForm.invalid || addingVariant()"
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                @if (addingVariant()) {
                  Adding...
                } @else {
                  Add Variant
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class VariantManagerComponent implements OnChanges {
  @Input() productId!: string;

  private productService = inject(ProductService);
  private storeContext = inject(StoreContextService);
  private fb = inject(FormBuilder);

  // State
  loading = signal(false);
  showVariantSetup = signal(false);
  variantOptions = signal<VariantOptionDto[]>([]);
  variants = signal<ProductVariantDto[]>([]);

  hasVariants = computed(() => this.variantOptions().length > 0);
  canGenerateVariants = computed(() => {
    const options = this.variantOptions();
    if (options.length === 0) return false;
    const existingCount = this.variants().length;
    const possibleCount = options.reduce((acc, opt) => acc * opt.values.length, 1);
    return existingCount < possibleCount;
  });

  // Forms
  newOptionForm: FormGroup;
  newVariantForm: FormGroup;

  // Edit state
  editingVariantId = signal<string | null>(null);
  editForm = { sku: '', priceOverride: null as number | null, quantity: 0 };

  // Stock adjustment
  adjustingStockVariant = signal<ProductVariantDto | null>(null);
  stockAdjustment = { quantity: 0, type: 'Adjustment', reason: '' };

  // Loading states
  savingOption = signal(false);
  savingVariant = signal(false);
  savingStock = signal(false);
  addingVariant = signal(false);
  generatingVariants = signal(false);
  optionError = signal<string | null>(null);

  constructor() {
    this.newOptionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      values: ['', [Validators.required]]
    });

    this.newVariantForm = this.fb.group({
      sku: ['', Validators.required],
      priceOverride: [null],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && this.productId) {
      this.loadVariants();
    }
  }

  loadVariants(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.productId) return;

    this.loading.set(true);
    this.productService.getProductWithVariants(storeId, this.productId).subscribe({
      next: (data) => {
        this.variantOptions.set(data.variantOptions || []);
        this.variants.set(data.variants || []);
        this.showVariantSetup.set(data.hasVariants);
        this.updateNewVariantForm();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load variants:', err);
        this.loading.set(false);
      }
    });
  }

  enableVariants(): void {
    this.showVariantSetup.set(true);
  }

  addVariantOption(): void {
    if (this.newOptionForm.invalid) return;

    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    const { name, values } = this.newOptionForm.value;
    const valuesArray = values.split(',').map((v: string) => v.trim()).filter((v: string) => v);

    if (valuesArray.length === 0) {
      this.optionError.set('Please enter at least one value');
      return;
    }

    this.savingOption.set(true);
    this.optionError.set(null);

    this.productService.addVariantOption(storeId, this.productId, {
      name: name.trim(),
      values: valuesArray
    }).subscribe({
      next: (data) => {
        this.variantOptions.set(data.variantOptions || []);
        this.variants.set(data.variants || []);
        this.newOptionForm.reset();
        this.updateNewVariantForm();
        this.savingOption.set(false);
      },
      error: (err) => {
        this.optionError.set(err.error?.message || 'Failed to add option');
        this.savingOption.set(false);
      }
    });
  }

  updateNewVariantForm(): void {
    // Dynamically add form controls for each variant option
    const options = this.variantOptions();
    options.forEach(option => {
      const controlName = 'attr_' + option.name;
      if (!this.newVariantForm.contains(controlName)) {
        this.newVariantForm.addControl(controlName, this.fb.control('', Validators.required));
      }
    });
  }

  generateAllVariants(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    const options = this.variantOptions();
    if (options.length === 0) return;

    // Generate all combinations
    const combinations = this.generateCombinations(options);
    const existingKeys = new Set(this.variants().map(v =>
      Object.entries(v.attributes).sort().map(([k, v]) => `${k}:${v}`).join('|')
    ));

    // Filter out existing variants
    const newCombinations = combinations.filter(combo => {
      const key = Object.entries(combo).sort().map(([k, v]) => `${k}:${v}`).join('|');
      return !existingKeys.has(key);
    });

    if (newCombinations.length === 0) return;

    this.generatingVariants.set(true);
    let completed = 0;

    newCombinations.forEach((combo, index) => {
      const sku = this.generateSku(combo);
      this.productService.addVariant(storeId, this.productId, {
        attributes: combo,
        sku,
        quantity: 0,
        allowBackorder: false
      }).subscribe({
        next: (variant) => {
          this.variants.update(variants => [...variants, variant]);
          completed++;
          if (completed === newCombinations.length) {
            this.generatingVariants.set(false);
          }
        },
        error: () => {
          completed++;
          if (completed === newCombinations.length) {
            this.generatingVariants.set(false);
          }
        }
      });
    });
  }

  private generateCombinations(options: VariantOptionDto[]): Record<string, string>[] {
    if (options.length === 0) return [{}];

    const [first, ...rest] = options;
    const restCombinations = this.generateCombinations(rest);

    const combinations: Record<string, string>[] = [];
    first.values.forEach(value => {
      restCombinations.forEach(combo => {
        combinations.push({ [first.name]: value, ...combo });
      });
    });

    return combinations;
  }

  private generateSku(attributes: Record<string, string>): string {
    return Object.values(attributes)
      .map(v => v.substring(0, 3).toUpperCase())
      .join('-');
  }

  editVariant(variant: ProductVariantDto): void {
    this.editingVariantId.set(variant.id);
    this.editForm = {
      sku: variant.sku,
      priceOverride: variant.priceOverride || null,
      quantity: variant.quantity
    };
  }

  cancelEdit(): void {
    this.editingVariantId.set(null);
  }

  saveVariant(variant: ProductVariantDto): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.savingVariant.set(true);

    this.productService.updateVariant(storeId, this.productId, variant.id, {
      sku: this.editForm.sku,
      priceOverride: this.editForm.priceOverride ? { amount: this.editForm.priceOverride, currency: Currency.SAR } : undefined,
      quantity: this.editForm.quantity,
      allowBackorder: variant.allowBackorder
    }).subscribe({
      next: (updated) => {
        this.variants.update(variants =>
          variants.map(v => v.id === updated.id ? updated : v)
        );
        this.editingVariantId.set(null);
        this.savingVariant.set(false);
      },
      error: (err) => {
        console.error('Failed to update variant:', err);
        this.savingVariant.set(false);
      }
    });
  }

  showAdjustStock(variant: ProductVariantDto): void {
    this.adjustingStockVariant.set(variant);
    this.stockAdjustment = { quantity: 0, type: 'Adjustment', reason: '' };
  }

  cancelStockAdjustment(): void {
    this.adjustingStockVariant.set(null);
  }

  submitStockAdjustment(): void {
    const storeId = this.storeContext.currentStoreId();
    const variant = this.adjustingStockVariant();
    if (!storeId || !variant) return;

    this.savingStock.set(true);

    this.productService.adjustVariantInventory(storeId, this.productId, variant.id, {
      quantityChange: this.stockAdjustment.quantity,
      movementType: this.stockAdjustment.type as InventoryMovementType,
      reason: this.stockAdjustment.reason || undefined
    }).subscribe({
      next: () => {
        // Update local variant quantity
        this.variants.update(variants =>
          variants.map(v => v.id === variant.id
            ? { ...v, quantity: v.quantity + this.stockAdjustment.quantity }
            : v
          )
        );
        this.adjustingStockVariant.set(null);
        this.savingStock.set(false);
      },
      error: (err) => {
        console.error('Failed to adjust stock:', err);
        this.savingStock.set(false);
      }
    });
  }

  addNewVariant(): void {
    if (this.newVariantForm.invalid) return;

    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    const formValue = this.newVariantForm.value;

    // Extract attributes from form
    const attributes: Record<string, string> = {};
    this.variantOptions().forEach(option => {
      attributes[option.name] = formValue['attr_' + option.name];
    });

    this.addingVariant.set(true);

    this.productService.addVariant(storeId, this.productId, {
      attributes,
      sku: formValue.sku,
      priceOverride: formValue.priceOverride ? { amount: formValue.priceOverride, currency: Currency.SAR } : undefined,
      quantity: formValue.quantity,
      allowBackorder: false
    }).subscribe({
      next: (variant) => {
        this.variants.update(variants => [...variants, variant]);
        // Reset only value fields, keep attribute selections
        this.newVariantForm.patchValue({ sku: '', priceOverride: null, quantity: 0 });
        this.addingVariant.set(false);
      },
      error: (err) => {
        console.error('Failed to add variant:', err);
        this.addingVariant.set(false);
      }
    });
  }
}
