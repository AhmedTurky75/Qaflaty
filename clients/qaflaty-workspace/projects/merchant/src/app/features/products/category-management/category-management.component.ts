import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../services/category.service';
import { CategoryTreeComponent } from '../components/category-tree/category-tree.component';
import { StoreContextService } from '../../../core/services/store-context.service';
import { CategoryTreeDto, CategoryDto } from 'shared';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CategoryTreeComponent],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private storeContext = inject(StoreContextService);

  categories = signal<CategoryTreeDto[]>([]);
  flatCategories = signal<CategoryDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  showCategoryForm = signal(false);
  isEditMode = signal(false);
  editingCategoryId = signal<string | null>(null);

  categoryForm: FormGroup;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      slug: ['', Validators.required],
      parentId: ['']
    });

    // Auto-generate slug from name
    this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditMode()) {
        const slug = this.categoryService.generateSlug(name);
        this.categoryForm.patchValue({ slug }, { emitEvent: false });
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

  onAddCategory(): void {
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ parentId: '' });
    this.showCategoryForm.set(true);
  }

  onAddChildCategory(parent: CategoryTreeDto): void {
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ parentId: parent.id });
    this.showCategoryForm.set(true);
  }

  onEditCategory(category: CategoryTreeDto): void {
    this.isEditMode.set(true);
    this.editingCategoryId.set(category.id);
    this.categoryForm.patchValue({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || ''
    });
    this.showCategoryForm.set(true);
  }

  onDeleteCategory(category: CategoryTreeDto): void {
    this.categoryService.deleteCategory(category.id).subscribe({
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
    const categoryData = {
      name: formValue.name,
      slug: formValue.slug,
      parentId: formValue.parentId || undefined
    };

    if (this.isEditMode() && this.editingCategoryId()) {
      // Update existing category
      this.categoryService.updateCategory(this.editingCategoryId()!, {
        name: categoryData.name
      }).subscribe({
        next: () => {
          this.showCategoryForm.set(false);
          this.categoryForm.reset();
          this.loadCategories();
        },
        error: (err) => {
          alert(`Failed to update category: ${err.message}`);
        }
      });
    } else {
      // Create new category
      this.categoryService.createCategory(storeId, categoryData).subscribe({
        next: () => {
          this.showCategoryForm.set(false);
          this.categoryForm.reset();
          this.loadCategories();
        },
        error: (err) => {
          alert(`Failed to create category: ${err.message}`);
        }
      });
    }
  }

  onCancelForm(): void {
    this.showCategoryForm.set(false);
    this.categoryForm.reset();
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
  }

  get name() {
    return this.categoryForm.get('name');
  }

  get slug() {
    return this.categoryForm.get('slug');
  }
}
