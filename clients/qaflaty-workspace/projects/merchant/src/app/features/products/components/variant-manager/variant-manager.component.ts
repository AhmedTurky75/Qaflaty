import { Component, Input, inject, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProductService } from '../../services/product.service';
import { StoreContextService } from '../../../../core/services/store-context.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import {
  ProductVariantDto,
  VariantOptionDto,
  InventoryMovementType,
  Currency
} from 'shared';

@Component({
  selector: 'app-variant-manager',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TranslocoPipe, IconComponent],
  templateUrl: './variant-manager.component.html',
  styleUrl: './variant-manager.component.scss',
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

    const combinations = this.generateCombinations(options);
    const existingKeys = new Set(this.variants().map(v =>
      Object.entries(v.attributes).sort().map(([k, val]) => `${k}:${val}`).join('|')
    ));

    const newCombinations = combinations.filter(combo => {
      const key = Object.entries(combo).sort().map(([k, val]) => `${k}:${val}`).join('|');
      return !existingKeys.has(key);
    });

    if (newCombinations.length === 0) return;

    this.generatingVariants.set(true);
    let completed = 0;

    newCombinations.forEach((combo) => {
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
