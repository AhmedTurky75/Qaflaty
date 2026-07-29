import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CategoryService } from '../services/category.service';
import { CategoryTreeComponent } from '../components/category-tree/category-tree.component';
import { StoreContextService } from '../../../core/services/store-context.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MediaService } from '../services/media.service';
import { CategoryTreeDto, CategoryDto, CategoryIconComponent, CATEGORY_ICONS } from 'shared';

/** Matches CategoryContent.MaxLength on the server. */
const MAX_CONTENT_LENGTH = 20000;

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoPipe, CategoryTreeComponent, IconComponent, CategoryIconComponent],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private mediaService = inject(MediaService);
  private fb = inject(FormBuilder);
  private storeContext = inject(StoreContextService);

  readonly iconChoices = CATEGORY_ICONS;
  readonly maxContentLength = MAX_CONTENT_LENGTH;

  categories = signal<CategoryTreeDto[]>([]);
  flatCategories = signal<CategoryDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  showCategoryForm = signal(false);
  isEditMode = signal(false);
  editingCategoryId = signal<string | null>(null);

  /** Uploaded image URL for the category being edited (null = use the icon instead). */
  imageUrl = signal<string | null>(null);
  uploadingImage = signal(false);
  uploadError = signal<string | null>(null);

  categoryForm: FormGroup;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      nameAr: ['', [Validators.maxLength(100)]],
      slug: ['', Validators.required],
      parentId: [''],
      iconName: ['grid'],
      contentHtml: ['', [Validators.maxLength(MAX_CONTENT_LENGTH)]],
      contentHtmlAr: ['', [Validators.maxLength(MAX_CONTENT_LENGTH)]]
    });

    // Auto-generate slug from name
    this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditMode()) {
        const slug = this.categoryService.generateSlug(name);
        this.categoryForm.patchValue({ slug }, { emitEvent: false });
      }
    });

    // Keep the new category's target rank in sync if the merchant changes the parent dropdown
    // after opening the "add" form, so it still lands at the end of the parent it's actually saved
    // under, not the one selected when the form was first opened.
    this.categoryForm.get('parentId')?.valueChanges.subscribe(parentId => {
      if (!this.isEditMode()) {
        this.pendingSortOrder = this.nextSortOrder(parentId || null);
      }
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    const storeId = this.storeContext.currentStoreId() || '';
    if (!storeId) {
      this.error.set('Please select a store first');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Load both tree and flat list
    this.categoryService.getCategoryTree(storeId).subscribe({
      next: (tree) => {
        this.categories.set(tree);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load categories');
        this.loading.set(false);
      }
    });

    this.categoryService.getCategories(storeId).subscribe({
      next: (categories) => {
        this.flatCategories.set(categories);
      },
      error: (err) => {
        console.error('Failed to load flat categories:', err);
      }
    });
  }

  /** Rank assigned to the category being created — the end of its sibling group; not user-editable. */
  private pendingSortOrder = 0;

  onAddCategory(): void {
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
    this.pendingSortOrder = this.nextSortOrder(null);
    this.resetFormState({ parentId: '' });
    this.showCategoryForm.set(true);
  }

  onAddChildCategory(parent: CategoryTreeDto): void {
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
    this.pendingSortOrder = this.nextSortOrder(parent.id);
    this.resetFormState({ parentId: parent.id });
    this.showCategoryForm.set(true);
  }

  onEditCategory(category: CategoryTreeDto): void {
    this.isEditMode.set(true);
    this.editingCategoryId.set(category.id);
    this.imageUrl.set(category.imageUrl || null);
    this.uploadError.set(null);
    this.categoryForm.patchValue({
      name: category.name,
      nameAr: category.nameAr || '',
      slug: category.slug,
      parentId: category.parentId || '',
      iconName: category.iconName || 'grid',
      contentHtml: category.contentHtml || '',
      contentHtmlAr: category.contentHtmlAr || ''
    });
    this.showCategoryForm.set(true);
  }

  /** Puts a new category at the end of its sibling group so it doesn't collide with existing ranks. */
  private nextSortOrder(parentId: string | null): number {
    const siblings = this.flatCategories().filter(c => (c.parentId || null) === parentId);
    if (siblings.length === 0) return 0;
    return Math.max(...siblings.map(c => c.sortOrder ?? 0)) + 1;
  }

  private resetFormState(patch: Record<string, unknown>): void {
    this.imageUrl.set(null);
    this.uploadError.set(null);
    this.categoryForm.reset({
      name: '',
      nameAr: '',
      slug: '',
      parentId: '',
      iconName: 'grid',
      contentHtml: '',
      contentHtmlAr: '',
      ...patch
    });
  }

  /**
   * Persists a drag-and-drop reorder from the category tree. `categories` is the full sibling
   * group at whichever level was reordered, already in its new order — sortOrder is just each
   * item's index within that group.
   */
  onReorderCategories(categories: CategoryTreeDto[]): void {
    const storeId = this.storeContext.currentStoreId() || '';
    if (!storeId) return;

    const items = categories.map((c, index) => ({ categoryId: c.id, sortOrder: index }));
    this.categoryService.reorderCategories(storeId, items).subscribe({
      next: () => this.loadCategories(),
      error: (err) => {
        alert(`Failed to save the new order: ${err.message}`);
        this.loadCategories();
      }
    });
  }

  onSelectIcon(icon: string): void {
    this.categoryForm.patchValue({ iconName: icon });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const storeId = this.storeContext.currentStoreId() || '';
    if (!storeId) {
      this.uploadError.set('Please select a store first');
      return;
    }

    this.uploadingImage.set(true);
    this.uploadError.set(null);

    this.mediaService.uploadImages(storeId, [file]).subscribe({
      next: ({ urls }) => {
        if (urls.length > 0) this.imageUrl.set(urls[0]);
        this.uploadingImage.set(false);
        // Let the same file be picked again after a removal.
        input.value = '';
      },
      error: (err) => {
        this.uploadError.set(err?.error?.message || err.message || 'Upload failed');
        this.uploadingImage.set(false);
        input.value = '';
      }
    });
  }

  onRemoveImage(): void {
    this.imageUrl.set(null);
  }

  onDeleteCategory(category: CategoryTreeDto): void {
    const storeId = this.storeContext.currentStoreId() || '';
    this.categoryService.deleteCategory(storeId, category.id).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (err) => {
        alert(`Failed to delete category: ${err.message}`);
      }
    });
  }

  onSubmitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const storeId = this.storeContext.currentStoreId() || '';
    if (!storeId) {
      this.error.set('Please select a store first');
      return;
    }

    const formValue = this.categoryForm.value;
    // An uploaded image wins over the icon, so only send the icon when there is no image.
    const image = this.imageUrl();
    const categoryData = {
      name: formValue.name,
      nameAr: formValue.nameAr || undefined,
      slug: formValue.slug,
      parentId: formValue.parentId || undefined,
      imageUrl: image,
      iconName: image ? null : (formValue.iconName || null),
      contentHtml: formValue.contentHtml || null,
      contentHtmlAr: formValue.contentHtmlAr || null
    };

    if (this.isEditMode() && this.editingCategoryId()) {
      // Update existing category. sortOrder is omitted — reordering is done by dragging in the
      // tree (onReorderCategories), so an edit here must never disturb the current rank.
      this.categoryService.updateCategory(storeId, this.editingCategoryId()!, categoryData).subscribe({
        next: () => {
          this.closeForm();
          this.loadCategories();
        },
        error: (err) => {
          alert(`Failed to update category: ${err.message}`);
        }
      });
    } else {
      // Create new category at the end of its sibling group.
      this.categoryService.createCategory(storeId, { ...categoryData, sortOrder: this.pendingSortOrder }).subscribe({
        next: () => {
          this.closeForm();
          this.loadCategories();
        },
        error: (err) => {
          alert(`Failed to create category: ${err.message}`);
        }
      });
    }
  }

  onCancelForm(): void {
    this.closeForm();
  }

  private closeForm(): void {
    this.showCategoryForm.set(false);
    this.categoryForm.reset();
    this.imageUrl.set(null);
    this.uploadError.set(null);
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
  }

  get name() {
    return this.categoryForm.get('name');
  }

  get nameAr() {
    return this.categoryForm.get('nameAr');
  }

  get slug() {
    return this.categoryForm.get('slug');
  }

  get iconName() {
    return this.categoryForm.get('iconName');
  }
}
