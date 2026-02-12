import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageConfigurationDto, SectionConfigurationDto } from 'shared';

interface SectionVariant {
  id: string;
  label: string;
}

@Component({
  selector: 'app-section-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Edit Sections: {{ page?.title?.english }}
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              Configure the sections displayed on this page
            </p>
          </div>
          <button
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Sections List -->
      <div class="p-6 space-y-4 max-h-96 overflow-y-auto">
        @for (section of localSections; track section.id; let idx = $index) {
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-start gap-4">
              <!-- Drag Handle / Order Controls -->
              <div class="flex flex-col gap-1">
                <button
                  (click)="moveUp(idx)"
                  [disabled]="idx === 0"
                  [class.opacity-50]="idx === 0"
                  [class.cursor-not-allowed]="idx === 0"
                  class="text-gray-400 hover:text-gray-600 disabled:hover:text-gray-400"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                  </svg>
                </button>
                <button
                  (click)="moveDown(idx)"
                  [disabled]="idx === localSections.length - 1"
                  [class.opacity-50]="idx === localSections.length - 1"
                  [class.cursor-not-allowed]="idx === localSections.length - 1"
                  class="text-gray-400 hover:text-gray-600 disabled:hover:text-gray-400"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>

              <!-- Section Details -->
              <div class="flex-1 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-base font-medium text-gray-900">
                    {{ section.sectionType }}
                    <span class="text-sm text-gray-500 ml-2">(Order: {{ section.sortOrder }})</span>
                  </h4>
                  <div class="flex items-center">
                    <label class="text-sm font-medium text-gray-700 mr-2">Enabled</label>
                    <input
                      type="checkbox"
                      [(ngModel)]="section.isEnabled"
                      class="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Variant</label>
                  <select
                    [(ngModel)]="section.variantId"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    @for (variant of getVariantsForSection(section.sectionType); track variant.id) {
                      <option [value]="variant.id">{{ variant.label }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="bg-gray-50 rounded-lg p-8 text-center">
            <p class="text-gray-500">No sections available for this page.</p>
          </div>
        }
      </div>

      <!-- Footer with Save Button -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button
          (click)="onClose()"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Cancel
        </button>
        <button
          (click)="onSave()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  `
})
export class SectionEditorComponent implements OnInit {
  @Input() page: PageConfigurationDto | null = null;
  @Output() save = new EventEmitter<SectionConfigurationDto[]>();
  @Output() close = new EventEmitter<void>();

  localSections: SectionConfigurationDto[] = [];

  // Available variants for different section types
  private sectionVariants: Record<string, SectionVariant[]> = {
    Hero: [
      { id: 'FullWidthImage', label: 'Full Width Image' },
      { id: 'SplitContent', label: 'Split Content' },
      { id: 'VideoBackground', label: 'Video Background' },
      { id: 'Minimal', label: 'Minimal' }
    ],
    FeaturedProducts: [
      { id: 'Grid', label: 'Grid Layout' },
      { id: 'Carousel', label: 'Carousel' },
      { id: 'List', label: 'List View' }
    ],
    Categories: [
      { id: 'IconGrid', label: 'Icon Grid' },
      { id: 'ImageGrid', label: 'Image Grid' },
      { id: 'Carousel', label: 'Carousel' }
    ],
    Testimonials: [
      { id: 'Cards', label: 'Cards' },
      { id: 'Carousel', label: 'Carousel' },
      { id: 'Grid', label: 'Grid Layout' }
    ],
    Newsletter: [
      { id: 'Inline', label: 'Inline Form' },
      { id: 'Modal', label: 'Modal Popup' },
      { id: 'Banner', label: 'Banner' }
    ],
    Default: [
      { id: 'Standard', label: 'Standard' }
    ]
  };

  ngOnInit(): void {
    if (this.page && this.page.sections) {
      this.localSections = JSON.parse(JSON.stringify(this.page.sections));
      this.localSections.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  getVariantsForSection(sectionType: string): SectionVariant[] {
    return this.sectionVariants[sectionType] || this.sectionVariants['Default'];
  }

  moveUp(index: number): void {
    if (index === 0) return;
    [this.localSections[index], this.localSections[index - 1]] =
    [this.localSections[index - 1], this.localSections[index]];
    this.updateSortOrders();
  }

  moveDown(index: number): void {
    if (index === this.localSections.length - 1) return;
    [this.localSections[index], this.localSections[index + 1]] =
    [this.localSections[index + 1], this.localSections[index]];
    this.updateSortOrders();
  }

  private updateSortOrders(): void {
    this.localSections.forEach((section, index) => {
      section.sortOrder = index + 1;
    });
  }

  onSave(): void {
    this.save.emit(this.localSections);
  }

  onClose(): void {
    this.close.emit();
  }
}
