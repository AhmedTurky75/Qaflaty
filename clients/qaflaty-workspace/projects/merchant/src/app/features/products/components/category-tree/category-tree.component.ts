import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { CategoryTreeDto } from 'shared';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.scss']
})
export class CategoryTreeComponent {
  private transloco = inject(TranslocoService);

  @Input({ required: true }) categories: CategoryTreeDto[] = [];
  @Input() level: number = 0;
  @Output() edit = new EventEmitter<CategoryTreeDto>();
  @Output() delete = new EventEmitter<CategoryTreeDto>();
  @Output() addChild = new EventEmitter<CategoryTreeDto>();

  expandedCategories = new Set<string>();

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
