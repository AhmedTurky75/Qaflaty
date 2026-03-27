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
  template: `
    <div class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Custom Product Properties</h3>
          <p class="text-sm text-gray-500 mt-0.5">
            Define custom attributes for your products (e.g. material, size, color, weight).
            Merchants can then set values per product.
          </p>
        </div>

        <!-- Add Form -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          <h4 class="text-sm font-semibold text-gray-700">{{ editingId() ? 'Edit Property' : 'Add New Property' }}</h4>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">
                Machine Name <span class="text-gray-400">(lowercase, no spaces)</span>
              </label>
              <input
                type="text"
                [(ngModel)]="newDef.name"
                [disabled]="!!editingId()"
                placeholder="e.g. material"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
              <input
                type="text"
                [(ngModel)]="newDef.displayName"
                placeholder="e.g. Material"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                [(ngModel)]="newDef.type"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Text">Text (free input)</option>
                <option value="Number">Number</option>
                <option value="SingleChoice">Single Choice (one from list)</option>
                <option value="MultiChoice">Multi Choice (multiple from list)</option>
                <option value="Boolean">Boolean (Yes/No)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
              <input
                type="number"
                [(ngModel)]="newDef.sortOrder"
                min="0"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          @if (newDef.type === 'SingleChoice' || newDef.type === 'MultiChoice') {
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">
                Options <span class="text-gray-400">(comma-separated, e.g. Cotton, Polyester, Linen)</span>
              </label>
              <input
                type="text"
                [(ngModel)]="newDef.options"
                placeholder="Option 1, Option 2, Option 3"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          }

          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="newDef.isRequired" class="h-4 w-4 text-blue-600 rounded" />
              <span class="text-sm text-gray-700">Required</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="newDef.isFilterable" class="h-4 w-4 text-blue-600 rounded" />
              <span class="text-sm text-gray-700">Filterable (show in store search)</span>
            </label>
          </div>

          <div class="flex gap-2">
            <button
              (click)="saveDefinition()"
              [disabled]="saving() || !newDef.name || !newDef.displayName"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving() ? 'Saving...' : editingId() ? 'Update Property' : 'Add Property' }}
            </button>
            @if (editingId()) {
              <button
                (click)="cancelEdit()"
                class="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            }
          </div>
        </div>

        <!-- Existing Definitions -->
        @if (loading()) {
          <p class="text-sm text-gray-500 text-center py-4">Loading...</p>
        } @else if (definitions().length === 0) {
          <div class="text-center py-8 text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            <p class="text-sm">No custom properties defined yet.</p>
          </div>
        } @else {
          <div class="space-y-2">
            <h4 class="text-sm font-semibold text-gray-700">Defined Properties ({{ definitions().length }})</h4>
            @for (def of definitions(); track def.id) {
              <div class="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-800">{{ def.displayName }}</span>
                    <code class="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{{ def.name }}</code>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {{ def.type }}
                    </span>
                    @if (def.isRequired) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Required</span>
                    }
                    @if (def.isFilterable) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">Filterable</span>
                    }
                  </div>
                  @if (def.options && def.options.length > 0) {
                    <p class="text-xs text-gray-500 mt-1">Options: {{ def.options.join(', ') }}</p>
                  }
                </div>
                <div class="flex items-center gap-2 ml-4">
                  <button (click)="startEdit(def)" class="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                  <button (click)="deleteDefinition(def.id)" class="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
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
