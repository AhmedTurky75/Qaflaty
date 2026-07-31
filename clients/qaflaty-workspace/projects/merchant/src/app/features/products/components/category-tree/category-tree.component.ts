import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoryTreeDto, CategoryIconComponent } from 'shared';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [TranslocoPipe, IconComponent, CategoryIconComponent, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.scss']
})
export class CategoryTreeComponent implements OnChanges {
  private transloco = inject(TranslocoService);

  @Input({ required: true }) categories: CategoryTreeDto[] = [];
  @Input() level: number = 0;
  @Output() edit = new EventEmitter<CategoryTreeDto>();
  @Output() delete = new EventEmitter<CategoryTreeDto>();
  @Output() addChild = new EventEmitter<CategoryTreeDto>();
  /** Emits this level's sibling group in its new order after a drag-and-drop reorder. */
  @Output() reorder = new EventEmitter<CategoryTreeDto[]>();

  /** Local copy so a drag can reorder the displayed rows immediately, before the save round-trips. */
  displayCategories: CategoryTreeDto[] = [];

  expandedCategories = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categories']) {
      this.displayCategories = [...this.categories];
    }
  }

  onDrop(event: CdkDragDrop<CategoryTreeDto[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.displayCategories, event.previousIndex, event.currentIndex);
    this.reorder.emit(this.displayCategories);
  }

  toggleExpand(categoryId: string): void {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }
  }

  isExpanded(categoryId: string): boolean {
    return this.expandedCategories.has(categoryId);
  }

  onEdit(category: CategoryTreeDto, event: Event): void {
    event.stopPropagation();
    this.edit.emit(category);
  }

  onDelete(category: CategoryTreeDto, event: Event): void {
    event.stopPropagation();
    if (confirm(this.transloco.translate('products.cat.deleteConfirm', { name: category.name }))) {
      this.delete.emit(category);
    }
  }

  onAddChild(category: CategoryTreeDto, event: Event): void {
    event.stopPropagation();
    this.addChild.emit(category);
  }

  getIndentation(): string {
    return `${this.level * 1.5}rem`;
  }
}
