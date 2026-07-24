import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderService } from './services/builder.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { ProductPropertyDefinitionDto } from 'shared';

type PropertyType = 'Text' | 'Number' | 'SingleChoice' | 'MultiChoice' | 'Boolean';

interface NewDefinition {
  name: string;
  displayName: string;
  type: PropertyType;
  options: string;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

@Component({
  selector: 'app-product-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-properties-panel.component.html',
  styleUrl: './product-properties-panel.component.scss'
})
export class ProductPropertiesPanelComponent implements OnInit {
  private builderService = inject(BuilderService);
  private storeContext = inject(StoreContextService);

  definitions = signal<ProductPropertyDefinitionDto[]>([]);
  loading = signal(true);
  saving = signal(false);
  editingId = signal<string | null>(null);

  newDef: NewDefinition = this.emptyDef();

  ngOnInit(): void {
    this.loadDefinitions();
  }

  private emptyDef(): NewDefinition {
    return {
      name: '', displayName: '', type: 'Text',
      options: '', isRequired: false, isFilterable: false,
      sortOrder: this.definitions().length
    };
  }

  private loadDefinitions(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;
    this.loading.set(true);
    this.builderService.getProductPropertyDefinitions(storeId).subscribe({
      next: (defs) => { this.definitions.set(defs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  saveDefinition(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.newDef.name || !this.newDef.displayName) return;

    const options = this.newDef.options
      ? this.newDef.options.split(',').map(o => o.trim()).filter(o => o)
      : [];

    this.saving.set(true);
    const id = this.editingId();

    if (id) {
      this.builderService.updateProductPropertyDefinition(storeId, id, {
        displayName: this.newDef.displayName,
        type: this.newDef.type,
        options,
        isRequired: this.newDef.isRequired,
        isFilterable: this.newDef.isFilterable,
        sortOrder: this.newDef.sortOrder
      }).subscribe({
        next: () => { this.saving.set(false); this.cancelEdit(); this.loadDefinitions(); },
        error: (err) => { this.saving.set(false); alert(`Failed: ${err.message}`); }
      });
    } else {
      this.builderService.createProductPropertyDefinition(storeId, {
        name: this.newDef.name,
        displayName: this.newDef.displayName,
        type: this.newDef.type,
        options,
        isRequired: this.newDef.isRequired,
        isFilterable: this.newDef.isFilterable,
        sortOrder: this.newDef.sortOrder
      }).subscribe({
        next: () => { this.saving.set(false); this.newDef = this.emptyDef(); this.loadDefinitions(); },
        error: (err) => { this.saving.set(false); alert(`Failed: ${err.message}`); }
      });
    }
  }

  startEdit(def: ProductPropertyDefinitionDto): void {
    this.editingId.set(def.id);
    this.newDef = {
      name: def.name,
      displayName: def.displayName,
      type: def.type,
      options: def.options.join(', '),
      isRequired: def.isRequired,
      isFilterable: def.isFilterable,
      sortOrder: def.sortOrder
    };
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.newDef = this.emptyDef();
  }

  deleteDefinition(id: string): void {
    if (!confirm('Delete this property? Existing product values will be lost.')) return;
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;
    this.builderService.deleteProductPropertyDefinition(storeId, id).subscribe({
      next: () => this.loadDefinitions(),
      error: (err) => alert(`Failed: ${err.message}`)
    });
  }
}
