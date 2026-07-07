import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { BuilderService } from '../../store-builder/services/builder.service';
import { ImageUploadComponent, ImageItem } from '../components/image-upload/image-upload.component';
import { VariantManagerComponent } from '../components/variant-manager/variant-manager.component';
import { InventoryHistoryComponent } from '../components/inventory-history/inventory-history.component';
import { LandingPagePanelComponent } from '../components/landing-page-panel/landing-page-panel.component';
import { StoreContextService } from '../../../core/services/store-context.service';
import { CategoryDto, ProductStatus, ProductPropertyDefinitionDto } from 'shared';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, ImageUploadComponent, VariantManagerComponent, InventoryHistoryComponent, LandingPagePanelComponent],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private builderService = inject(BuilderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected storeContext = inject(StoreContextService);

  productForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  categories = signal<CategoryDto[]>([]);
  images = signal<ImageItem[]>([]);
  propertyDefinitions = signal<ProductPropertyDefinitionDto[]>([]);
  propertyValues = signal<Record<string, string>>({});

  isEditMode = signal(false);
  productId: string | null = null;

  ProductStatus = ProductStatus;
  productStatusOptions = [
    { value: ProductStatus.Draft, label: 'Draft' },
    { value: ProductStatus.Active, label: 'Active' },
    { value: ProductStatus.Inactive, label: 'Inactive' }
  ];

  /** The store's single currency — prices are entered in this; there is no per-product currency. */
  storeCurrency = computed(() => this.storeContext.currentStore()?.currency ?? 'EGP');

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      nameAr: ['', [Validators.maxLength(200)]],
      slug: ['', Validators.required],
      description: ['', Validators.maxLength(2000)],
      categoryId: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      currency: [this.storeContext.currentStore()?.currency ?? 'EGP', Validators.required],
      compareAtPrice: [null, Validators.min(0)],
      quantity: [0, [Validators.required, Validators.min(0)]],
      sku: [''],
      trackInventory: [true],
      status: [ProductStatus.Draft, Validators.required]
    });

    // Auto-generate slug from name
    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditMode()) {
        const slug = this.productService.generateSlug(name);
        this.productForm.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadPropertyDefinitions();

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode.set(true);
      this.loadProduct(this.productId);
    }
  }

  loadPropertyDefinitions(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;
    this.builderService.getProductPropertyDefinitions(storeId).subscribe({
      next: (defs) => this.propertyDefinitions.set(defs),
      error: () => {}
    });
  }

  onPropertyValueChange(definitionId: string, value: string): void {
    this.propertyValues.update(current => ({ ...current, [definitionId]: value }));
  }

  isMultiChoiceSelected(definitionId: string, option: string): boolean {
    const val = this.propertyValues()[definitionId] || '';
    return val.split(',').map(v => v.trim()).includes(option);
  }

  toggleMultiChoice(definitionId: string, option: string, checked: boolean): void {
    const current = (this.propertyValues()[definitionId] || '').split(',').map(v => v.trim()).filter(v => v);
    const updated = checked
      ? [...new Set([...current, option])]
      : current.filter(v => v !== option);
    this.onPropertyValueChange(definitionId, updated.join(', '));
  }

  loadCategories(): void {
    const storeId = this.storeContext.currentStoreId() || '';
    if (!storeId) return;

    this.categoryService.getCategories(storeId).subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
      }
    });
  }

  loadProduct(id: string): void {
    const storeId = this.storeContext.currentStoreId() || '';
    this.loading.set(true);
    this.productService.getProductById(storeId, id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          nameAr: product.nameAr || '',
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId || '',
          price: product.price,
          currency: 'SAR',
          compareAtPrice: product.compareAtPrice || null,
          quantity: product.quantity,
          sku: product.sku,
          trackInventory: product.trackInventory,
          status: product.status
        });

        this.images.set((product.images || []).map(img => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          sortOrder: img.sortOrder
        })));

        // Load property values from product DTO
        if (product.propertyValues && product.propertyValues.length > 0) {
          const map: Record<string, string> = {};
          product.propertyValues.forEach((v: { definitionId: string; value: string }) => {
            map[v.definitionId] = v.value;
          });
          this.propertyValues.set(map);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load product');
        this.loading.set(false);
      }
    });
  }

  onImagesChange(images: ImageItem[]): void {
    this.images.set(images);
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const storeId = this.storeContext.currentStoreId() || '';
    if (!storeId) {
      this.error.set('Please select a store first');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.productForm.value;
    const productData = {
      name: formValue.name,
      nameAr: formValue.nameAr || undefined,
      slug: formValue.slug,
      description: formValue.description || undefined,
      categoryId: formValue.categoryId || undefined,
      price: {
        amount: formValue.price,
        currency: formValue.currency
      },
      compareAtPrice: formValue.compareAtPrice ? {
        amount: formValue.compareAtPrice,
        currency: formValue.currency
      } : undefined,
      quantity: formValue.quantity,
      sku: formValue.sku || undefined,
      trackInventory: formValue.trackInventory,
      status: formValue.status,
      images: this.images().map(img => ({
        id: img.id || undefined,
        url: img.url,
        altText: img.altText || undefined,
        sortOrder: img.sortOrder
      }))
    };

    if (this.isEditMode() && this.productId) {
      this.productService.updateProduct(storeId, this.productId, productData).subscribe({
        next: (product) => {
          this.savePropertyValues(product.id);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to update product');
          this.loading.set(false);
        }
      });
    } else {
      this.productService.createProduct(storeId, productData).subscribe({
        next: (product) => {
          this.savePropertyValues(product.id);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to create product');
          this.loading.set(false);
        }
      });
    }
  }

  private savePropertyValues(productId: string): void {
    const values = this.propertyValues();
    const entries = Object.entries(values)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([definitionId, value]) => ({ definitionId, value }));

    if (entries.length === 0) {
      this.router.navigate(['/products']);
      return;
    }

    this.productService.setProductPropertyValues(productId, entries).subscribe({
      next: () => this.router.navigate(['/products']),
      error: () => this.router.navigate(['/products']) // navigate even if props fail
    });
  }

  get name() {
    return this.productForm.get('name');
  }

  get nameAr() {
    return this.productForm.get('nameAr');
  }

  get slug() {
    return this.productForm.get('slug');
  }

  get description() {
    return this.productForm.get('description');
  }

  get price() {
    return this.productForm.get('price');
  }

  get compareAtPrice() {
    return this.productForm.get('compareAtPrice');
  }

  get quantity() {
    return this.productForm.get('quantity');
  }

  get sku() {
    return this.productForm.get('sku');
  }
}
